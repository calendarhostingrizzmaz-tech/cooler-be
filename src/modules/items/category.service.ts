import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategory();
  }

  private async seedDefaultCategory() {
    const defaultCategory = await this.categoryRepository.findOne({ where: { name: 'Other' } });
    if (!defaultCategory) {
      const newCategory = this.categoryRepository.create({ name: 'Other' });
      await this.categoryRepository.save(newCategory);
      this.logger.log('Default "Other" category seeded.');
    }
  }

  async create(name: string) {
    const category = this.categoryRepository.create({ name });
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    return await this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, name: string) {
    const category = await this.findOne(id);
    category.name = name;
    return await this.categoryRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    // Move items to 'Other' or prevent removal if items exist
    // For now, we prevention is safer as per plan
    const itemsCount = await this.categoryRepository.manager.count('items', { where: { categoryId: id } });
    if (itemsCount > 0) {
      throw new Error('Cannot delete category with associated items. Please reassign items first.');
    }
    await this.categoryRepository.remove(category);
  }

  async getDefaultCategory() {
    return await this.categoryRepository.findOne({ where: { name: 'Other' } });
  }
}
