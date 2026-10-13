import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, ProviderProfile, Payment, RefundRequest, Advertisement, SystemSetting } from '../../../entities';
import { RefundStatus, PaymentStatus } from '../../../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepo: Repository<ProviderProfile>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(RefundRequest)
    private readonly refundRepo: Repository<RefundRequest>,
    @InjectRepository(Advertisement)
    private readonly adsRepo: Repository<Advertisement>,
    @InjectRepository(SystemSetting)
    private readonly settingsRepo: Repository<SystemSetting>,
  ) {}

  /**
   * 6. TABLEAU DE BORD : Métriques globales
   */
  async getDashboardStats() {
    const totalUsers = await this.userRepo.count();
    const totalProviders = await this.providerProfileRepo.count();
    const totalPayments = await this.paymentRepo.count({ where: { status: PaymentStatus.COMPLETED } });
    
    // Chiffre d'affaires total
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();
    
    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // Demandes de remboursement en attente (validation manuelle)
    const pendingRefunds = await this.refundRepo.count({
      where: { status: RefundStatus.PENDING },
    });

    const activeAdsCount = await this.adsRepo.count({ where: { isActive: true } });

    return {
      totalUsers,
      totalProviders,
      totalPayments,
      totalRevenue,
      pendingRefunds,
      activeAdsCount,
    };
  }

  /**
   * Gestion des utilisateurs et prestataires
   */
  async getAllUsers() {
    return this.userRepo.find({
      relations: ['providerProfile'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getAllProviders() {
    return this.providerProfileRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllPayments() {
    return this.paymentRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * 4. & 6. GESTION DES DEMANDES DE REMBOURSEMENT (Validation Manuelle Strictement)
   */
  async getRefundRequests(status?: RefundStatus) {
    const query = this.refundRepo.createQueryBuilder('r')
      .innerJoinAndSelect('r.client', 'client')
      .innerJoinAndSelect('r.unlock', 'unlock')
      .innerJoinAndSelect('unlock.provider', 'provider');

    if (status) {
      query.where('r.status = :status', { status });
    }

    return query.orderBy('r.createdAt', 'DESC').getMany();
  }

  /**
   * Traitement d'une demande de remboursement par l'administrateur
   */
  async processRefundRequest(
    adminId: string,
    refundId: string,
    action: 'APPROVE' | 'REJECT',
    adminComment?: string,
  ) {
    const refund = await this.refundRepo.findOne({
      where: { id: refundId },
      relations: ['unlock', 'unlock.payment'],
    });

    if (!refund) throw new NotFoundException('Demande de remboursement non trouvée');

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    refund.reviewedByAdminId = adminId;
    refund.reviewedAt = new Date();
    refund.adminComment = adminComment || (action === 'APPROVE' ? 'Remboursement accordé' : 'Demande rejetée');

    if (action === 'APPROVE') {
      refund.status = RefundStatus.APPROVED;
      // Mettre à jour le paiement associé si présent
      if (refund.unlock?.payment) {
        refund.unlock.payment.status = PaymentStatus.REFUNDED;
        await this.paymentRepo.save(refund.unlock.payment);
      }
    } else {
      refund.status = RefundStatus.REJECTED;
    }

    await this.refundRepo.save(refund);

    return {
      message: `Demande de remboursement ${action === 'APPROVE' ? 'VALIDÉE' : 'REJETÉE'} avec succès.`,
      refund,
    };
  }

  /**
   * 6. GESTION DES PRIX ET PÉRIODES GRATUITES DANS LES PARAMETRES DU SYSTEME
   */
  async getSettings() {
    const defaults = [
      { settingKey: 'PROVIDER_SUBSCRIPTION_PRICE', settingValue: '5000', description: 'Prix abonnement mensuel prestataire (FCFA)' },
      { settingKey: 'PROVIDER_FREE_TRIAL_MONTHS', settingValue: '1', description: 'Nombre de mois gratuits offert au prestataire' },
      { settingKey: 'CLIENT_CONTACT_PRICE', settingValue: '1000', description: 'Prix de mise en contact client (FCFA)' },
      { settingKey: 'CLIENT_FREE_TRIAL_DAYS', settingValue: '7', description: 'Nombre de jours gratuits offerts au nouveau client' },
    ];

    const currentSettings = await this.settingsRepo.find();
    if (currentSettings.length === 0) {
      await this.settingsRepo.save(defaults);
      return defaults;
    }
    return currentSettings;
  }

  async updateSetting(key: string, value: string) {
    let setting = await this.settingsRepo.findOne({ where: { settingKey: key } });
    if (!setting) {
      setting = this.settingsRepo.create({ settingKey: key, settingValue: value });
    } else {
      setting.settingValue = value;
    }
    return this.settingsRepo.save(setting);
  }
}
