import { Controller, Post, Get, Body, UseGuards, Req, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { FreeEnrollDto } from './dto/free-enroll.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('free-enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  freeEnroll(
    @CurrentUser('sub') userId: string,
    @Body() dto: FreeEnrollDto,
  ) {
    return this.orderService.freeEnroll(userId, dto);
  }

  @Post('free-enroll-group')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  freeEnrollGroup(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateGroupOrderDto,
  ) {
    return this.orderService.freeEnrollGroup(userId, dto);
  }

  @Post('create-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  createOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }

  @Post('create-group-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  createGroupOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateGroupOrderDto,
  ) {
    return this.orderService.createGroupOrder(userId, dto);
  }

  @Post('validate-coupon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  validateCoupon(
    @Body('code') code: string,
  ) {
    return this.orderService.validateCoupon(code);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  getMyOrders(
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.getMyOrders(userId);
  }

  @Get(':orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  getOrderDetails(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getOrderDetails(userId, orderId);
  }

  @Post('cancel-order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  cancelOrder(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.cancelOrder(userId, orderId);
  }
}
