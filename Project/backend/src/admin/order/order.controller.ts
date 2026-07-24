import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminOrderService } from './order.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { order_status } from '@prisma/client';

@Controller('api/admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrderController {
  constructor(private readonly orderService: AdminOrderService) {}

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: order_status,
  ) {
    return this.orderService.updateStatus(id, status);
  }
}
