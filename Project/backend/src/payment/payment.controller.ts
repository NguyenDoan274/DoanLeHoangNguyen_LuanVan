import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import express from 'express';
import { PaymentService } from './payment.service';
import { CreateVNPayUrlDto } from './dto/create-vnpay-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-vnpay-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  createVNPayUrl(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateVNPayUrlDto,
    @Req() req: express.Request,
  ) {
    // Attempt to get client IP Address
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    
    // x-forwarded-for can be a list, take the first one
    const cleanIp = ipAddr.split(',')[0].trim();
    
    return this.paymentService.createVNPayUrl(userId, dto, cleanIp);
  }

  @Get('vnpay-callback')
  verifyVNPayCallback(@Query() query: any) {
    return this.paymentService.verifyVNPayCallback(query);
  }
}
