import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, ProviderProfile } from '../../../entities';
import { UserRole, AvailabilityStatus } from '../../../common/enums';
import { AuthCredentialsDto, ChooseRoleDto, UpdateUserPreferencesDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepository: Repository<ProviderProfile>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Interface unifiée Connexion & Inscription
   * Si l'utilisateur n'existe pas -> il est automatiquement créé avec statut PENDING
   * S'il existe -> vérifie son mot de passe et connecte
   */
  async authenticateOrRegister(dto: AuthCredentialsDto) {
    const email = dto.email.toLowerCase().trim();
    let user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'countryCode', 'preferredLanguage', 'clientTrialExpiresAt', 'firstName', 'lastName'],
    });

    let isNewUser = false;

    if (!user) {
      // Inscription automatique
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      // Calcul de la semaine d'essai gratuite client (7 jours)
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      user = this.userRepository.create({
        email,
        passwordHash,
        role: UserRole.PENDING,
        countryCode: dto.countryCode || 'CI',
        preferredLanguage: dto.preferredLanguage || 'fr',
        clientTrialExpiresAt: trialExpiresAt,
      });

      await this.userRepository.save(user);
      isNewUser = true;
    } else {
      // Connexion : vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides (mot de passe incorrect)');
      }
    }

    const token = this.generateToken(user);
    const providerProfile = await this.providerProfileRepository.findOne({ where: { userId: user.id } });

    return {
      accessToken: token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        countryCode: user.countryCode,
        preferredLanguage: user.preferredLanguage,
        clientTrialExpiresAt: user.clientTrialExpiresAt,
        providerProfile: providerProfile || null,
      },
    };
  }

  /**
   * Choix du rôle après l'inscription (Client ou Prestataire)
   */
  async chooseRole(userId: string, dto: ChooseRoleDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.role !== UserRole.PENDING && user.role !== UserRole.ADMIN) {
      // Si déjà assigné, permet une mise à jour ou conserve
    }

    if (dto.role === 'CLIENT') {
      user.role = UserRole.CLIENT;
      // 1 semaine gratuite pour chaque nouveau client à l'inscription
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 7);
      user.clientTrialExpiresAt = trialDate;
      await this.userRepository.save(user);

      return {
        message: 'Rôle Client configuré avec succès. Vous bénéficiez de 7 jours gratuits pour les mises en relation !',
        role: user.role,
        trialExpiresAt: user.clientTrialExpiresAt,
      };
    } else if (dto.role === 'PROVIDER') {
      user.role = UserRole.PROVIDER;
      await this.userRepository.save(user);

      // Calcul du 1 mois gratuit pour le prestataire avant son premier abonnement (30 jours)
      const trialSubscription = new Date();
      trialSubscription.setDate(trialSubscription.getDate() + 30);

      let profile = await this.providerProfileRepository.findOne({ where: { userId } });
      if (!profile) {
        profile = this.providerProfileRepository.create({
          userId: user.id,
          singleName: dto.singleName || user.email.split('@')[0],
          fullName: dto.fullName || dto.singleName || 'Prestataire',
          serviceOffered: dto.serviceOffered || 'Services Généraux',
          city: dto.city || 'Abidjan',
          department: dto.department || 'Lagunes',
          availability: AvailabilityStatus.AVAILABLE,
          receivesOnSite: true,
          travelRequired: false,
          travelFee: 0,
          whatsappNumber: dto.whatsappNumber || '',
          directPhoneNumber: dto.phoneNumber || '',
          subscriptionExpiresAt: trialSubscription,
          isTrialUsed: true,
        });
      } else {
        profile.singleName = dto.singleName || profile.singleName;
        profile.serviceOffered = dto.serviceOffered || profile.serviceOffered;
        profile.city = dto.city || profile.city;
        profile.department = dto.department || profile.department;
        if (!profile.subscriptionExpiresAt) {
          profile.subscriptionExpiresAt = trialSubscription;
        }
      }

      await this.providerProfileRepository.save(profile);

      return {
        message: 'Rôle Prestataire activé avec succès ! Votre 1er mois d’abonnement (5000 FCFA) est offert.',
        role: user.role,
        providerProfile: profile,
      };
    } else {
      throw new BadRequestException('Rôle non reconnu');
    }
  }

  /**
   * Mise à jour de la langue et du pays
   */
  async updatePreferences(userId: string, dto: UpdateUserPreferencesDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    if (dto.countryCode) user.countryCode = dto.countryCode;
    if (dto.preferredLanguage) user.preferredLanguage = dto.preferredLanguage;

    await this.userRepository.save(user);
    return {
      countryCode: user.countryCode,
      preferredLanguage: user.preferredLanguage,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['providerProfile'],
    });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
    return user;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
