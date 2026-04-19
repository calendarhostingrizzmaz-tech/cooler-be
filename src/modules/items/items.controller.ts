import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { S3Service } from '../../shared/s3/s3.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file field received (expected multipart field name "file")');
    }
    const url = await this.s3Service.uploadFile(file);
    return { url };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'files', maxCount: 5 },
    ]),
  )
  create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFiles()
    uploaded: { file?: Express.Multer.File[]; files?: Express.Multer.File[] },
  ) {
    const file = uploaded?.file?.[0];
    const files = uploaded?.files ?? [];
    return this.itemsService.create(createItemDto, file, files);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const minP = minPrice != null && minPrice !== '' ? Number(minPrice) : undefined;
    const maxP = maxPrice != null && maxPrice !== '' ? Number(maxPrice) : undefined;
    return this.itemsService.findAll(
      +page,
      +limit,
      categoryId ? +categoryId : undefined,
      Number.isFinite(minP) ? minP : undefined,
      Number.isFinite(maxP) ? maxP : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'files', maxCount: 5 },
    ]),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFiles()
    uploaded: { file?: Express.Multer.File[]; files?: Express.Multer.File[] },
  ) {
    const file = uploaded?.file?.[0];
    const files = uploaded?.files ?? [];
    return this.itemsService.update(id, updateItemDto, file, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.remove(id);
  }
}
