import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities';

@Injectable()
export class UserActivationMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Les routes publiques passent
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.decode(token);
      if (!decoded || !decoded.sub) {
        return next();
      }

      // Vérifier le statut d'activation en base de données
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        select: ['id', 'email', 'isActive', 'role'],
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      // Si le compte n'est pas encore activé par code OTP
      if (!user.isActive && !req.path.includes('/auth/verify-otp') && !req.path.includes('/auth/resend-otp')) {
        throw new ForbiddenException(
          'Compte non activé. Veuillez valider votre code OTP envoyé par email/SMS pour continuer.',
        );
      }

      // Injection dans req.user pour RLS et contrôleurs
      (req as any).user = user;
      next();
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) {
        throw err;
      }
      return next();
    }
  }
}
