import { Controller, Post, Body, Get, UseGuards, HttpCode } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({
    summary: 'Bank + WhatsApp for checkout (public; configure via env)',
  })
  @Get('checkout-info')
  getCheckoutInfo() {
    return this.ordersService.getCheckoutInfo();
  }

  @ApiOperation({ summary: 'Place an order (triggers WhatsApp notification)' })
  @HttpCode(201)
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @ApiOperation({ summary: 'Get all orders (admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }
}
