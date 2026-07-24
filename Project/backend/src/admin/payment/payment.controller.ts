import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminPaymentService } from './payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPaymentController {
  constructor(private readonly paymentService: AdminPaymentService) {}

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.paymentService.getStats();
  }
}
