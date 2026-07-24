import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { VnpayModule } from 'nestjs-vnpay';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        const tmnCode = process.env.VNP_TMNCODE || '';
        const secureSecret = process.env.VNP_HASHSECRET || '';
        console.log('VNP_TMNCODE', tmnCode);
        console.log('VNP_HASHSECRET', secureSecret);
        return {
          tmnCode,
          secureSecret,
          vnpayHost: 'https://sandbox.vnpayment.vn',
          testMode: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule { }
