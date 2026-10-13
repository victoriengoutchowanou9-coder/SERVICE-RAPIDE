import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ProviderProfile, User, ContactUnlock, Payment, RefundRequest } from '../../entities';
import { AvailabilityStatus, PaymentType, PaymentStatus, PaymentMethod, RefundStatus } from '../../common/enums';
import { FilterProvidersDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepo: Repository<ProviderProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ContactUnlock)
    private readonly contactUnlockRepo: Repository<ContactUnlock>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(RefundRequest)
    private readonly refundRequestRepo: Repository<RefundRequest>,
  ) {}

  /**
   * 3. CLIENT : Le client connecté voit la liste de tous les prestataires.
   * - Dans la liste : un seul nom du prestataire (pas le nom complet), sa ville, sa disponibilité.
   * - Le contact reste masqué.
   * - CONDITION REQUISE : Sans abonnement actif, le profil n'est pas visible !
   */
  async getProvidersList(clientId: string, filters: FilterProvidersDto) {
    const now = new Date();

    // Récupérer les prestataires dont l'abonnement ou le mois gratuit est valide (> now)
    const query = this.providerProfileRepo.createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u')
      .where('p.subscriptionExpiresAt > :now', { now });

    if (filters.service) {
      query.andWhere('LOWER(p.serviceOffered) LIKE LOWER(:service)', {
        service: `%${filters.service}%`,
      });
    }
    if (filters.city) {
      query.andWhere('LOWER(p.city) LIKE LOWER(:city)', {
        city: `%${filters.city}%`,
      });
    }
    if (filters.countryCode) {
      query.andWhere('u.countryCode = :countryCode', {
        countryCode: filters.countryCode,
      });
    }

    const providers = await query.getMany();

    // Récupérer tous les contacts déjà débloqués par ce client
    const clientUnlocks = await this.contactUnlockRepo.find({
      where: { clientId },
      relations: ['refundRequest'],
    });
    const unlockedMap = new Map(clientUnlocks.map((u) => [u.providerId, u]));

    // Mapper selon les règles strictes d'affichage
    return providers.map((provider) => {
      const unlock = unlockedMap.get(provider.id);
      const isUnlocked = Boolean(unlock);

      return {
        id: provider.id,
        // Un seul nom du prestataire (pas le nom complet)
        singleName: provider.singleName,
        serviceOffered: provider.serviceOffered,
        city: provider.city,
        department: provider.department,
        // Disponibilité
        availability: provider.availability,
        receivesOnSite: provider.receivesOnSite,
        travelRequired: provider.travelRequired,
        travelFee: provider.travelFee,
        // NOUVEAU : Tarif du prestataire visible par les clients avant mise en contact
        basePrice: provider.basePrice || 5000,
        pricingUnit: provider.pricingUnit || 'par prestation',
        // Contact : masqué par défaut, révélé uniquement après déblocage
        isContactUnlocked: isUnlocked,
        unlockId: unlock ? unlock.id : null,
        refundStatus: unlock?.refundRequest ? unlock.refundRequest.status : null,
        contact: isUnlocked
          ? {
              directPhone: provider.directPhoneNumber || provider.user.phoneNumber,
              whatsappNumber: provider.whatsappNumber || provider.user.phoneNumber,
              fullName: provider.fullName,
            }
          : {
              directPhone: '•••••••••• (Masqué)',
              whatsappNumber: '•••••••••• (Masqué)',
            },
      };
    });
  }

  /**
   * 3. MISE EN CONTACT : 1000 FCFA (avec une semaine gratuite pour chaque nouveau client).
   * - Si le prestataire est Occupé, la mise en contact est impossible et le contact reste bloqué.
   */
  async unlockProviderContact(clientId: string, providerId: string, paymentMethod?: PaymentMethod, phoneNumberUsed?: string) {
    const client = await this.userRepo.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client non trouvé');

    const provider = await this.providerProfileRepo.findOne({
      where: { id: providerId },
      relations: ['user'],
    });
    if (!provider) throw new NotFoundException('Prestataire non trouvé');

    // REGLE STRICTE : Si le prestataire est Occupé, la mise en contact est impossible
    if (provider.availability === AvailabilityStatus.BUSY) {
      throw new BadRequestException(
        'Ce prestataire est actuellement OCCUPÉ. La mise en contact est impossible.'
      );
    }

    // Vérifier si déjà débloqué
    const existing = await this.contactUnlockRepo.findOne({
      where: { clientId, providerId },
    });
    if (existing) {
      return {
        message: 'Ce contact est déjà débloqué',
        unlock: existing,
        contact: {
          directPhone: provider.directPhoneNumber || provider.user.phoneNumber,
          whatsappNumber: provider.whatsappNumber,
          fullName: provider.fullName,
        },
      };
    }

    // Vérifier si le client bénéficie de sa semaine gratuite à l'inscription (7 jours)
    const now = new Date();
    const isClientTrialActive = client.clientTrialExpiresAt && new Date(client.clientTrialExpiresAt) > now;

    let payment: Payment | null = null;
    let viaTrial = false;

    if (isClientTrialActive) {
      // Déblocage gratuit dans le cadre de la semaine d'essai offerte
      viaTrial = true;
    } else {
      // Paiement Mobile Money requis de 1000 FCFA
      payment = this.paymentRepo.create({
        userId: clientId,
        type: PaymentType.CLIENT_CONTACT_UNLOCK,
        amount: 1000,
        currency: 'XOF',
        method: paymentMethod || PaymentMethod.MTN_MOMO,
        status: PaymentStatus.COMPLETED,
        phoneNumberUsed: phoneNumberUsed || client.phoneNumber,
        transactionReference: `SR-CONTACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });
      await this.paymentRepo.save(payment);
    }

    // Création de l'enregistrement de mise en relation
    const unlock = this.contactUnlockRepo.create({
      clientId,
      providerId,
      paymentId: payment ? payment.id : null,
      isUnlockedViaTrial: viaTrial,
    });
    await this.contactUnlockRepo.save(unlock);

    return {
      message: viaTrial
        ? 'Contact débloqué avec succès grâce à votre semaine gratuite !'
        : 'Paiement de 1000 FCFA validé. Contact débloqué avec succès !',
      unlockedViaTrial: viaTrial,
      payment,
      contact: {
        directPhone: provider.directPhoneNumber || provider.user.phoneNumber,
        whatsappNumber: provider.whatsappNumber || provider.directPhoneNumber,
        fullName: provider.fullName,
      },
    };
  }

  /**
   * 4. REMBOURSEMENT :
   * Le client peut demander un remboursement après la mise en contact en cas de problème.
   * Chaque demande est validée manuellement par l'administrateur (jamais automatique).
   */
  async requestRefund(clientId: string, unlockId: string, reason: string) {
    const unlock = await this.contactUnlockRepo.findOne({
      where: { id: unlockId, clientId },
      relations: ['refundRequest', 'payment'],
    });

    if (!unlock) {
      throw new NotFoundException('Mise en contact non trouvée');
    }

    if (unlock.refundRequest) {
      throw new BadRequestException('Une demande de remboursement a déjà été soumise pour ce contact');
    }

    const refund = this.refundRequestRepo.create({
      clientId,
      unlockId,
      reason: reason || 'Problème de mise en relation',
      status: RefundStatus.PENDING,
    });

    await this.refundRequestRepo.save(refund);

    return {
      message: 'Demande de remboursement enregistrée. Elle sera examinée manuellement par un administrateur.',
      refund,
    };
  }

  /**
   * Historique des mises en contact du client
   */
  async getMyUnlockedContacts(clientId: string) {
    return this.contactUnlockRepo.find({
      where: { clientId },
      relations: ['provider', 'provider.user', 'refundRequest', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }
}
