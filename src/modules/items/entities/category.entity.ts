import { Entity, Column, OneToMany } from 'typeorm';
import Model from '../../../entities/base.entity';
import { Item } from './item.entity';

@Entity('categories')
export class Category extends Model {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}
