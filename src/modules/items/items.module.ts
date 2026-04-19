import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item } from './entities/item.entity';
import { ItemImage } from './entities/item-image.entity';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { JwtModule } from '@nestjs/jwt';
import { S3Service } from '../../shared/s3/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemImage, Category]),
    JwtModule.register({}),
  ],
  controllers: [ItemsController, CategoryController],
  providers: [ItemsService, CategoryService, S3Service],
  exports: [ItemsService, CategoryService, S3Service],
})
export class ItemsModule {}
