import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVNPayUrlDto } from './dto/create-vnpay-url.dto';
import * as crypto from 'crypto';
import { ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { VnpayService } from 'nestjs-vnpay';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
  ) {}

  async createVNPayUrl(userId: string, dto: CreateVNPayUrlDto, ipAddr: string) {
    const { order_id } = dto;

    const order = await this.prisma.orders.findUnique({
      where: { id: order_id },
      include: { order_items: true },
    });

    if (!order || order.student_id !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng của bạn.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán.');
    }

    const amount = parseFloat(order.final_price.toString());
    const paymentId = crypto.randomUUID();

    // Save payment record
    await this.prisma.payments.create({
      data: {
        id: paymentId,
        order_id: order.id,
        payment_method: 'VNPAY',
        amount: order.final_price,
        status: 'PENDING',
        created_at: new Date(),
      },
    });

    const cleanIp = (ipAddr || '127.0.0.1').replace('::ffff:', '').trim() === '::1' ? '127.0.0.1' : (ipAddr || '127.0.0.1').replace('::ffff:', '').trim();
    const txnRef = order.id.replace(/-/g, '');

    const returnUrl = 'http://localhost:5173/payment-callback';

    const buildUrlParams = {
      vnp_Amount: amount,
      vnp_IpAddr: cleanIp,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
    };
    console.log('[VNPay buildPaymentUrl Params]:', buildUrlParams);

    // The vnpay library automatically handles multiplying amount by 100
    const paymentUrl = this.vnpayService.buildPaymentUrl(buildUrlParams);
    console.log('[VNPay buildPaymentUrl Generated URL]:', paymentUrl);

    return {
      message: 'Tạo URL thanh toán thành công.',
      data: {
        payment_url: paymentUrl,
      },
    };
  }

  async verifyVNPayCallback(queryParams: any) {
    console.log('[VNPay Callback QueryParams]:', queryParams);
    let verifyResult;
    try {
      verifyResult = await this.vnpayService.verifyReturnUrl(queryParams);
      console.log('[VNPay Callback VerifyResult]:', verifyResult);
    } catch (error) {
      console.error('[VNPay Callback Error]:', error);
      throw new BadRequestException('Không thể xác thực giao dịch: ' + error.message);
    }

    let orderId = verifyResult.vnp_TxnRef;
    if (orderId && orderId.length === 32) {
      orderId = `${orderId.substring(0, 8)}-${orderId.substring(8, 12)}-${orderId.substring(12, 16)}-${orderId.substring(16, 20)}-${orderId.substring(20)}`;
    }
    const transactionNo = verifyResult.vnp_TransactionNo;
    const responseCode = verifyResult.vnp_ResponseCode;

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { order_items: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng tương ứng.');
    }

    // Idempotency check: if order is already completed, return success
    if (order.status === 'COMPLETED') {
      return {
        success: true,
        message: 'Thanh toán và đăng ký học thành công!',
        data: {
          order_id: orderId,
          course_id: order.order_items[0]?.course_id,
        },
      };
    }

    // Check if transaction has already been processed successfully
    if (transactionNo) {
      const existingPayment = await this.prisma.payments.findUnique({
        where: { transaction_reference: transactionNo },
      });
      if (existingPayment && existingPayment.status === 'SUCCESS') {
        return {
          success: true,
          message: 'Thanh toán và đăng ký học thành công!',
          data: {
            order_id: orderId,
            course_id: order.order_items[0]?.course_id,
          },
        };
      }
    }

    // verifyResult.isSuccess checks if checksum is valid and responseCode is '00'
    if (verifyResult.isSuccess) {
      // Payment Successful
      await this.prisma.$transaction(async (tx) => {
        // Update Order
        await tx.orders.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            updated_at: new Date(),
          },
        });

        // Update Payment
        const pendingPayment = await tx.payments.findFirst({
          where: { order_id: orderId, status: 'PENDING' },
        });

        if (pendingPayment) {
          await tx.payments.update({
            where: { id: pendingPayment.id },
            data: {
              status: 'SUCCESS',
              transaction_reference: transactionNo,
              paid_at: new Date(),
            },
          });
        } else {
          await tx.payments.create({
            data: {
              id: crypto.randomUUID(),
              order_id: orderId,
              payment_method: 'VNPAY',
              amount: order.final_price,
              status: 'SUCCESS',
              transaction_reference: transactionNo,
              paid_at: new Date(),
              created_at: new Date(),
            },
          });
        }

        if (order.coupon_id) {
          await tx.coupons.update({
            where: { id: order.coupon_id },
            data: {
              used_count: { increment: 1 },
            },
          });
        }

        // Enroll User into Courses from Order Items
        for (const item of order.order_items) {
          await tx.enrollments.upsert({
            where: {
              student_id_course_id: {
                student_id: order.student_id,
                course_id: item.course_id,
              },
            },
            update: {
              status: 'ACTIVE',
              enrolled_at: new Date(),
              order_item_id: item.id,
            },
            create: {
              id: crypto.randomUUID(),
              student_id: order.student_id,
              course_id: item.course_id,
              order_item_id: item.id,
              status: 'ACTIVE',
              enrolled_at: new Date(),
            },
          });
        }
      });

      return {
        success: true,
        message: 'Thanh toán và đăng ký học thành công!',
        data: {
          order_id: orderId,
          course_id: order.order_items[0]?.course_id,
        },
      };
    } else {
      // Payment Failed or Cancelled
      await this.prisma.$transaction(async (tx) => {
        // Update Order
        await tx.orders.update({
          where: { id: orderId },
          data: {
            status: 'FAILED',
            updated_at: new Date(),
          },
        });

        // Update Payment
        const pendingPayment = await tx.payments.findFirst({
          where: { order_id: orderId, status: 'PENDING' },
        });

        if (pendingPayment) {
          await tx.payments.update({
            where: { id: pendingPayment.id },
            data: {
              status: 'FAILED',
              transaction_reference: transactionNo,
            },
          });
        }
      });

      return {
        success: false,
        message: `Thanh toán thất bại (Mã lỗi: ${responseCode})`,
        data: {
          order_id: orderId,
        },
      };
    }
  }
}
