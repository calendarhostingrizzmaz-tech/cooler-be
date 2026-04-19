import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { WhatsappService } from './whatsapp.service';

export type CheckoutInfoPayload = {
  whatsappDigits: string;
  bank: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchOrNote: string;
  };
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  getCheckoutInfo(): CheckoutInfoPayload {
    const rawWa = this.config.get<string>('BUSINESS_WHATSAPP') || '';
    const whatsappDigits = rawWa.replace(/\D/g, '');

    return {
      whatsappDigits,
      bank: {
        bankName: (this.config.get<string>('PAYMENT_BANK_NAME') || '').trim(),
        accountTitle: (this.config.get<string>('PAYMENT_ACCOUNT_TITLE') || '').trim(),
        accountNumber: (this.config.get<string>('PAYMENT_ACCOUNT_NUMBER') || '').trim(),
        iban: (this.config.get<string>('PAYMENT_IBAN') || '').trim(),
        branchOrNote: (this.config.get<string>('PAYMENT_BRANCH_OR_NOTE') || '').trim(),
      },
    };
  }

  async create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepository.create(createOrderDto);
    const savedOrder = await this.orderRepository.save(order);

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendOrderNotification(
        createOrderDto.items,
        createOrderDto.phone,
        createOrderDto.address,
      );
    } catch (error) {
       this.logger.error('WhatsApp notification failed:', error.message);
    }

    return savedOrder;
  }

  async findAll() {
    return await this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
