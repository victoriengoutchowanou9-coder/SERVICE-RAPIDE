import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, ProviderProfile, User } from '../../entities';
import { PaymentType, PaymentStatus, PaymentMethod } from '../../common/enums';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepo: Repository<ProviderProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * 2. & 5. PAIEMENT ABONNEMENT PRESTATAIRE : 5000 FCFA
   * Prolonge la visibilité du prestataire de 30 jours
   */
  async payProviderSubscription(
    userId: string,
    method: PaymentMethod,
    phoneNumberUsed: string,
  ) {
    const profile = await this.providerProfileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil prestataire non trouvé');

    // Création du paiement Mobile Money
    const payment = this.paymentRepo.create({
      userId,
      type: PaymentType.PROVIDER_SUBSCRIPTION,
      amount: 5000,
      currency: 'XOF',
      method: method || PaymentMethod.MTN_MOMO,
      status: PaymentStatus.COMPLETED,
      phoneNumberUsed,
      transactionReference: `SR-SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });
    await this.paymentRepo.save(payment);

    // Mise à jour de la date d'expiration de l'abonnement
    const now = new Date();
    let currentExpires = profile.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt) : now;
    if (currentExpires < now) {
      currentExpires = now;
    }
    const newExpires = new Date(currentExpires);
    newExpires.setDate(newExpires.getDate() + 30); // Ajout de 30 jours (1 mois)

    profile.subscriptionExpiresAt = newExpires;
    await this.providerProfileRepo.save(profile);

    return {
      message: 'Abonnement de 5000 FCFA activé avec succès pour 30 jours !',
      payment,
      subscriptionExpiresAt: profile.subscriptionExpiresAt,
    };
  }

  /**
   * Historique des transactions de l'utilisateur
   */
  async getUserPayments(userId: string) {
    return this.paymentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
