import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { OrderItemDto } from './dto/create-order.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Twilio;

  constructor(private config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.client = new Twilio(sid, token);
  }

  async sendOrderNotification(
    items: OrderItemDto[],
    phone: string,
    address: string,
  ): Promise<void> {
    const ownerWhatsapp = this.config.get<string>('OWNER_WHATSAPP');
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');

    const itemsList = items
      .map((i) => `  • ${i.name} x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const message = ` *New Order Received!*\n\n*Items:*\n${itemsList}\n\n*Total:* PKR ${total.toFixed(2)}\n\n*Customer Phone:* ${phone}\n*Delivery Address:* ${address}`;

    try {
      await this.client.messages.create({
        body: message,
        from,
        to: ownerWhatsapp,
      });
      this.logger.log('WhatsApp order notification sent to owner');
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }
}
