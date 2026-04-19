import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import Model from '../../../entities/base.entity';
import { Item } from './item.entity';

@Entity('item_images')
export class ItemImage extends Model {
  @Column()
  url: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column()
  itemId: number;

  @ManyToOne(() => Item, (item) => item.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;
}
