import { Controller, Get, Patch, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { UpdateAvailabilityDto, UpdateProviderProfileDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get('me')
  getMyProfile(@Request() req) {
    return this.providerService.getMyProfile(req.user.id);
  }

  /**
   * 2. Disponibilité : Disponible / Occupé (modifiable en un clic)
   */
  @Patch('availability')
  updateAvailability(@Request() req, @Body() dto: UpdateAvailabilityDto) {
    return this.providerService.updateAvailability(req.user.id, dto);
  }

  /**
   * 2. Modification profil prestataire (Reçoit sur place, déplacement, WhatsApp, etc.)
   */
  @Put('profile')
  updateProfile(@Request() req, @Body() dto: UpdateProviderProfileDto) {
    return this.providerService.updateProfile(req.user.id, dto);
  }

  /**
   * 2. Statut abonnement (5000 FCFA avec mois gratuit)
   */
  @Get('subscription-status')
  checkSubscriptionStatus(@Request() req) {
    return this.providerService.checkSubscriptionStatus(req.user.id);
  }
}
