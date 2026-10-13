import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ProviderProfile, User } from '../../../entities';
import { AvailabilityStatus, UserRole } from '../../../common/enums';
import { UpdateAvailabilityDto, UpdateProviderProfileDto } from './dto/provider.dto';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepo: Repository<ProviderProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Récupérer le profil du prestataire connecté
   */
  async getMyProfile(userId: string) {
    const profile = await this.providerProfileRepo.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    const now = new Date();
    const isSubscriptionActive = profile.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) > now;

    return {
      ...profile,
      isSubscriptionActive,
    };
  }

  /**
   * 2. DISPONIBILITÉ : Disponible / Occupé (modifiable en un clic)
   */
  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const profile = await this.providerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    profile.availability = dto.availability;
    await this.providerProfileRepo.save(profile);

    return {
      message: `Statut mis à jour : ${profile.availability === AvailabilityStatus.AVAILABLE ? 'Disponible' : 'Occupé'}`,
      availability: profile.availability,
    };
  }

  /**
   * 2. MISE A JOUR DU PROFIL PRESTATAIRE
   * - Nom, service proposé, ville et département
   * - Reçoit sur place : Oui / Non
   * - Déplacement nécessaire : Oui / Non avec frais de déplacement à préciser
   * - WhatsApp
   */
  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    let profile = await this.providerProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.providerProfileRepo.create({ userId });
    }

    if (dto.singleName !== undefined) profile.singleName = dto.singleName;
    if (dto.fullName !== undefined) profile.fullName = dto.fullName;
    if (dto.serviceOffered !== undefined) profile.serviceOffered = dto.serviceOffered;
    if (dto.city !== undefined) profile.city = dto.city;
    if (dto.department !== undefined) profile.department = dto.department;
    if (dto.receivesOnSite !== undefined) profile.receivesOnSite = dto.receivesOnSite;
    if (dto.travelRequired !== undefined) {
      profile.travelRequired = dto.travelRequired;
      if (!dto.travelRequired) {
        profile.travelFee = 0;
      }
    }
    if (dto.travelFee !== undefined && profile.travelRequired) {
      profile.travelFee = dto.travelFee;
    }
    if (dto.whatsappNumber !== undefined) profile.whatsappNumber = dto.whatsappNumber;
    if (dto.directPhoneNumber !== undefined) profile.directPhoneNumber = dto.directPhoneNumber;

    await this.providerProfileRepo.save(profile);
    return profile;
  }

  /**
   * Vérification de l'état d'abonnement :
   * Sans abonnement actif (ou mois gratuit échu), le profil n'est pas visible
   */
  async checkSubscriptionStatus(userId: string) {
    const profile = await this.providerProfileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil introuvable');

    const now = new Date();
    const isActive = profile.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) > now;
    
    return {
      subscriptionExpiresAt: profile.subscriptionExpiresAt,
      isSubscriptionActive: Boolean(isActive),
      subscriptionPrice: 5000,
      currency: 'XOF',
      freeTrialUsed: profile.isTrialUsed,
    };
  }
}
