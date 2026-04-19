import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly repo: Repository<NewsletterSubscriber>,
    private readonly mailService: MailService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async subscribe(rawEmail: string): Promise<{
    alreadySubscribed: boolean;
  }> {
    const email = this.normalizeEmail(rawEmail);

    const existing = await this.repo.findOne({ where: { email } });
    if (existing) {
      return { alreadySubscribed: true };
    }

    const row = this.repo.create({ email });
    await this.repo.save(row);

    try {
      await this.mailService.sendNewsletterWelcomeEmail(email);
    } catch (err) {
      this.logger.error(
        `Newsletter saved but welcome email failed for ${email}: ${(err as Error).message}`,
      );
    }

    return { alreadySubscribed: false };
  }
}
