import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { S3Service } from '../../shared/s3/s3.service';
import { CategoryService } from './category.service';

/** Max gallery images (S3 URLs) per product — enforced on create/update. */
export const MAX_ITEM_IMAGES = 5;

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(ItemImage)
    private readonly itemImageRepository: Repository<ItemImage>,
    private readonly s3Service: S3Service,
    private readonly categoryService: CategoryService,
  ) {}

  /** Keeps discount only when 0 < discountedPrice < price; otherwise null. */
  private normalizeDiscountedPrice(
    price: number,
    discountedPrice: number | null | undefined,
  ): number | null {
    if (discountedPrice === null || discountedPrice === undefined) {
      return null;
    }
    const p = Number(price);
    const d = Number(discountedPrice);
    if (!Number.isFinite(p) || !Number.isFinite(d) || d <= 0 || d >= p) {
      return null;
    }
    return d;
  }

  private sortItemImages(item: Item): void {
    if (item.images?.length) {
      item.images.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  private dedupeOrdered(urls: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const u of urls) {
      const t = u.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }

  /**
   * Order: explicit `imageUrls`, optional legacy `image` string, then uploads
   * (`file` then `files`).
   */
  private async buildGalleryUrls(
    imageUrls: string[] | undefined,
    legacyImage: string | undefined,
    file: Express.Multer.File | undefined,
    extraFiles: Express.Multer.File[],
  ): Promise<string[]> {
    const list: string[] = [];
    if (imageUrls?.length) {
      list.push(...imageUrls);
    }
    if (legacyImage?.trim()) {
      list.push(legacyImage.trim());
    }
    if (file) {
      list.push(await this.s3Service.uploadFile(file));
    }
    for (const f of extraFiles) {
      if (f) {
        list.push(await this.s3Service.uploadFile(f));
      }
    }
    return this.dedupeOrdered(list);
  }

  private assertGalleryWithinLimit(urls: string[]): void {
    if (urls.length > MAX_ITEM_IMAGES) {
      throw new BadRequestException(
        `A product can have at most ${MAX_ITEM_IMAGES} images (got ${urls.length}).`,
      );
    }
  }

  private async replaceGallery(
    itemId: number,
    urls: string[],
    manager: EntityManager = this.itemRepository.manager,
  ): Promise<void> {
    const unique = this.dedupeOrdered(urls);
    await manager.delete(ItemImage, { itemId });
    if (!unique.length) {
      await manager.update(Item, { id: itemId }, { image: '' });
      return;
    }
    const repo = manager.getRepository(ItemImage);
    const rows = unique.map((url, sortOrder) =>
      repo.create({ itemId, url, sortOrder }),
    );
    await repo.save(rows);
    await manager.update(Item, { id: itemId }, { image: unique[0] });
  }

  async create(
    createItemDto: CreateItemDto,
    file?: Express.Multer.File,
    extraFiles: Express.Multer.File[] = [],
  ): Promise<Item> {
    const { imageUrls, ...rest } = createItemDto;
    const urls = await this.buildGalleryUrls(imageUrls, rest.image, file, extraFiles);
    this.assertGalleryWithinLimit(urls);

    if (!rest.categoryId) {
      const defaultCat = await this.categoryService.getDefaultCategory();
      if (defaultCat) {
        rest.categoryId = defaultCat.id;
      }
    }

    rest.discountedPrice = this.normalizeDiscountedPrice(
      Number(rest.price),
      rest.discountedPrice,
    );

    const item = this.itemRepository.create({
      ...rest,
      image: urls[0] ?? '',
    });
    const saved = await this.itemRepository.save(item);
    await this.replaceGallery(saved.id, urls);
    return this.findOne(saved.id);
  }

  /**
   * Unit price the customer pays (Postgres-safe).
   * Quote camelCase columns; alias matches QB (usually unquoted `item`).
   */
  private effectivePriceExpr(qbAlias: string): string {
    return `(CASE
      WHEN ${qbAlias}."discountedPrice" IS NOT NULL
        AND ${qbAlias}."discountedPrice"::numeric > 0
        AND ${qbAlias}."discountedPrice"::numeric < ${qbAlias}.price::numeric
      THEN ${qbAlias}."discountedPrice"::numeric
      ELSE ${qbAlias}.price::numeric
    END)`;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    categoryId?: number,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 10));

    let mn = minPrice;
    let mx = maxPrice;
    if (
      mn != null &&
      mx != null &&
      Number.isFinite(mn) &&
      Number.isFinite(mx) &&
      mn > mx
    ) {
      [mn, mx] = [mx, mn];
    }

    const qb = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category');

    if (categoryId != null && Number.isFinite(categoryId)) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    const eff = this.effectivePriceExpr('item');
    if (mn != null && Number.isFinite(mn) && mn >= 0) {
      qb.andWhere(`${eff} >= :minPrice`, { minPrice: mn });
    }
    if (mx != null && Number.isFinite(mx) && mx >= 0) {
      qb.andWhere(`${eff} <= :maxPrice`, { maxPrice: mx });
    }

    qb.orderBy('item.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [data, total] = await qb.getManyAndCount();

    const ids = data.map((row) => row.id);
    if (ids.length) {
      const allImages = await this.itemImageRepository.find({
        where: { itemId: In(ids) },
        order: { sortOrder: 'ASC' },
      });
      const byItem = new Map<number, ItemImage[]>();
      for (const img of allImages) {
        const list = byItem.get(img.itemId);
        if (list) list.push(img);
        else byItem.set(img.itemId, [img]);
      }
      for (const row of data) {
        row.images = byItem.get(row.id) ?? [];
      }
    }

    const lastPage = total === 0 ? 1 : Math.ceil(total / safeLimit);

    return {
      data,
      total,
      page: safePage,
      lastPage,
    };
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
    });
    if (!item) throw new NotFoundException(`Item #${id} not found`);
    this.sortItemImages(item);
    return item;
  }

  async update(
    id: number,
    updateItemDto: UpdateItemDto,
    file?: Express.Multer.File,
    extraFiles: Express.Multer.File[] = [],
  ): Promise<Item> {
    const item = await this.findOne(id);
    const dtoRecord = updateItemDto as Record<string, unknown>;

    const touchesGallery =
      !!file ||
      (extraFiles && extraFiles.length > 0) ||
      Object.prototype.hasOwnProperty.call(dtoRecord, 'imageUrls') ||
      Object.prototype.hasOwnProperty.call(dtoRecord, 'image');

    const { imageUrls, image, ...mergeRest } = updateItemDto;

    const nextPrice =
      mergeRest.price !== undefined ? Number(mergeRest.price) : Number(item.price);
    let nextDiscounted: number | null | undefined = item.discountedPrice ?? null;
    if (Object.prototype.hasOwnProperty.call(dtoRecord, 'discountedPrice')) {
      const raw = dtoRecord.discountedPrice;
      if (raw === null || raw === '' || raw === undefined) {
        nextDiscounted = null;
      } else {
        nextDiscounted = Number(raw);
      }
    }
    mergeRest.discountedPrice = this.normalizeDiscountedPrice(nextPrice, nextDiscounted);

    this.itemRepository.merge(item, mergeRest);

    let galleryUrls: string[] | null = null;
    if (touchesGallery) {
      galleryUrls = await this.buildGalleryUrls(
        imageUrls,
        image !== undefined && image !== null ? String(image) : undefined,
        file,
        extraFiles,
      );
      this.assertGalleryWithinLimit(galleryUrls);
      item.image = galleryUrls[0] ?? '';
    }

    const saved = await this.itemRepository.save(item);
    if (touchesGallery && galleryUrls) {
      await this.replaceGallery(saved.id, galleryUrls);
    }

    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
  }
}
