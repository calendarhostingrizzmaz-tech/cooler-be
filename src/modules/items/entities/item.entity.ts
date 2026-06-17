import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import Model from '../../../entities/base.entity';
import { Category } from './category.entity';
import { ItemImage } from './item-image.entity';

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity('items')
export class Item extends Model {
  @Column()
  name: string;

  @Column('decimal', { 
    precision: 10, 
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  price: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  discountedPrice: number | null;

  @Column()
  image: string;

  @Column('text')
  description: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.items)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ItemImage, (img) => img.item, { cascade: false })
  images: ItemImage[];
}
