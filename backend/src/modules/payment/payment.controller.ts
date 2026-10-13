import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentMethod } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Paiement de l'abonnement prestataire (5000 FCFA) par Mobile Money
   */
  @Post('provider-subscription')
  paySubscription(
    @Request() req,
    @Body() body: { method: PaymentMethod; phoneNumber: string },
  ) {
    return this.paymentService.payProviderSubscription(
      req.user.id,
      body.method,
      body.phoneNumber,
    );
  }

  /**
   * Historique des transactions personnelles
   */
  @Get('history')
  getMyPayments(@Request() req) {
    return this.paymentService.getUserPayments(req.user.id);
  }
}
