import { Entity, Column } from 'typeorm';
import Model from '../../../entities/base.entity';

@Entity('orders')
export class Order extends Model {
  @Column('jsonb')
  items: any;

  @Column()
  phone: string;

  @Column('text')
  address: string;
}
