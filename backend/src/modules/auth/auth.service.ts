import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, ProviderProfile } from '../../entities';
import { UserRole, AvailabilityStatus } from '../../common/enums';
import {
  AuthCredentialsDto,
  ChooseRoleDto,
  UpdateUserPreferencesDto,
  VerifyOtpDto,
  ResendOtpDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProviderProfile)
    private readonly providerProfileRepository: Repository<ProviderProfile>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Génération d'un code OTP aléatoire à 6 chiffres valide 10 minutes
   */
  private generateOtp(): { code: string; expiresAt: Date } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { code, expiresAt };
  }

  /**
   * Interface unifiée Connexion & Inscription avec génération OTP
   */
  async authenticateOrRegister(dto: AuthCredentialsDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Validation serveur stricte
    if (!email || !email.includes('@')) {
      throw new BadRequestException("Format d'adresse email invalide côté serveur");
    }
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Le mot de passe doit comporter au moins 8 caractères');
    }

    let user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',
        'role',
        'countryCode',
        'preferredLanguage',
        'clientTrialExpiresAt',
        'firstName',
        'lastName',
        'isActive',
        'otpCode',
        'otpExpiresAt',
      ],
    });

    let isNewUser = false;
    const { code: otpCode, expiresAt: otpExpiresAt } = this.generateOtp();

    if (!user) {
      // Inscription
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      user = this.userRepository.create({
        email,
        passwordHash,
        role: UserRole.PENDING,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode || 'CI',
        preferredLanguage: dto.preferredLanguage || 'fr',
        clientTrialExpiresAt: trialExpiresAt,
        isActive: false, // Compte inactif tant que l'OTP n'est pas validé
        otpCode,
        otpExpiresAt,
      });

      await this.userRepository.save(user);
      isNewUser = true;
      this.logger.log(`[OTP GÉNÉRÉ] Nouveau compte ${email} : Code OTP = ${otpCode}`);
    } else {
      // Connexion
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides (mot de passe incorrect)');
      }

      // Si le compte est déjà activé, il se connecte directement
      // Sinon, on génère un nouvel OTP pour terminer l'activation
      if (!user.isActive) {
        user.otpCode = otpCode;
        user.otpExpiresAt = otpExpiresAt;
        await this.userRepository.save(user);
        this.logger.log(`[OTP RENOUVELÉ] Compte inactif ${email} : Code OTP = ${otpCode}`);
      }
    }

    const token = this.generateToken(user);
    const providerProfile = await this.providerProfileRepository.findOne({ where: { userId: user.id } });

    return {
      accessToken: token,
      isNewUser,
      requiresOtp: !user.isActive,
      message: !user.isActive
        ? `Un code de confirmation OTP à 6 chiffres a été envoyé à ${email}. (Démo : ${otpCode})`
        : 'Authentification réussie',
      demoOtpCode: !user.isActive ? otpCode : undefined,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        countryCode: user.countryCode,
        preferredLanguage: user.preferredLanguage,
        clientTrialExpiresAt: user.clientTrialExpiresAt,
        providerProfile: providerProfile || null,
      },
    };
  }

  /**
   * Vérification et validation du code OTP (Activation du compte)
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'role', 'isActive', 'otpCode', 'otpExpiresAt'],
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (user.isActive) {
      return {
        message: 'Ce compte est déjà activé.',
        isActive: true,
        token: this.generateToken(user),
      };
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('Aucun code OTP en attente. Veuillez demander un nouveau code.');
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new BadRequestException('Le code OTP a expiré. Veuillez en demander un nouveau.');
    }

    if (user.otpCode !== dto.otp.trim()) {
      throw new BadRequestException('Code OTP invalide. Vérifiez les 6 chiffres saisis.');
    }

    // Activation du compte
    user.isActive = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log(`[COMPTE ACTIVÉ] L'utilisateur ${email} a validé son OTP avec succès.`);

    return {
      message: 'Compte activé avec succès ! Bienvenue sur SERVICE RAPIDE.',
      isActive: true,
      accessToken: this.generateToken(user),
    };
  }

  /**
   * Renvoi d'un nouveau code OTP
   */
  async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    if (user.isActive) {
      return { message: 'Votre compte est déjà vérifié et actif.' };
    }

    const { code, expiresAt } = this.generateOtp();
    user.otpCode = code;
    user.otpExpiresAt = expiresAt;
    await this.userRepository.save(user);

    this.logger.log(`[NOUVEL OTP ENVOYÉ] ${email} : Code OTP = ${code}`);

    return {
      message: `Nouveau code OTP généré pour ${email}`,
      demoOtpCode: code,
    };
  }

  /**
   * Choix du rôle après inscription
   */
  async chooseRole(userId: string, dto: ChooseRoleDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

    if (dto.role === 'CLIENT') {
      user.role = UserRole.CLIENT;
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 7);
      user.clientTrialExpiresAt = trialDate;
      await this.userRepository.save(user);

      return {
        message: 'Rôle Client configuré avec succès !',
        role: user.role,
        trialExpiresAt: user.clientTrialExpiresAt,
      };
    } else if (dto.role === 'PROVIDER') {
      user.role = UserRole.PROVIDER;
      await this.userRepository.save(user);

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
          department: dto.department || 'Centre',
          availability: AvailabilityStatus.AVAILABLE,
          receivesOnSite: true,
          travelRequired: false,
          travelFee: 0,
          basePrice: 5000,
          pricingUnit: 'par prestation',
          whatsappNumber: dto.whatsappNumber || '',
          directPhoneNumber: dto.phoneNumber || '',
          subscriptionExpiresAt: trialSubscription,
          isTrialUsed: true,
        });
      }

      await this.providerProfileRepository.save(profile);

      return {
        message: 'Rôle Prestataire activé avec succès ! 1er mois gratuit offert.',
        role: user.role,
        providerProfile: profile,
      };
    }
  }

  async updatePreferences(userId: string, dto: UpdateUserPreferencesDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (dto.countryCode) user.countryCode = dto.countryCode;
    if (dto.preferredLanguage) user.preferredLanguage = dto.preferredLanguage;
    await this.userRepository.save(user);
    return user;
  }

  async getMe(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['providerProfile'],
    });
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  }
}
