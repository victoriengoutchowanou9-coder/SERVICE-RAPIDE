import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ClientService } from './client.service';
import { FilterProvidersDto, RequestRefundDto } from './dto/client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentMethod } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * 3. Liste de tous les prestataires (seul un prénom, ville, dispo, contact masqué)
   */
  @Get('providers')
  getProviders(@Request() req, @Query() filters: FilterProvidersDto) {
    return this.clientService.getProvidersList(req.user.id, filters);
  }

  /**
   * 3. Mise en contact (1000 FCFA ou 1 semaine gratuite)
   */
  @Post('unlock-contact/:providerId')
  unlockContact(
    @Request() req,
    @Param('providerId') providerId: string,
    @Body() body: { paymentMethod?: PaymentMethod; phoneNumber?: string },
  ) {
    return this.clientService.unlockProviderContact(
      req.user.id,
      providerId,
      body.paymentMethod,
      body.phoneNumber,
    );
  }

  /**
   * 4. Demande de remboursement suite à une mise en contact
   */
  @Post('request-refund/:unlockId')
  requestRefund(
    @Request() req,
    @Param('unlockId') unlockId: string,
    @Body() dto: RequestRefundDto,
  ) {
    return this.clientService.requestRefund(req.user.id, unlockId, dto.reason);
  }

  /**
   * Mes contacts débloqués
   */
  @Get('my-unlocks')
  getMyUnlocks(@Request() req) {
    return this.clientService.getMyUnlockedContacts(req.user.id);
  }
}
