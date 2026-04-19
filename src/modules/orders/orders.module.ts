import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { WhatsappService } from './whatsapp.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    JwtModule.register({}),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, WhatsappService],
})
export class OrdersModule {}
