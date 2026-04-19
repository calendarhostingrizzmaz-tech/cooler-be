import { Entity, Column } from 'typeorm';
import Model from '../../../entities/base.entity';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber extends Model {
  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;
}
