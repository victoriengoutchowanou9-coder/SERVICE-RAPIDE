import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  // Stockage mémoire par adresse IP
  private ipRequests = new Map<string, RateLimitRecord>();

  // Limite : 4 tentatives par minute par adresse IP
  private readonly MAX_ATTEMPTS = 4;
  private readonly WINDOW_MS = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    let record = this.ipRequests.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      };
      this.ipRequests.set(clientIp, record);
    } else {
      record.count += 1;
    }

    // Calcul des headers de rate limit
    const remaining = Math.max(0, this.MAX_ATTEMPTS - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', this.MAX_ATTEMPTS);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > this.MAX_ATTEMPTS) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Trop de tentatives d'authentification. Limite de ${this.MAX_ATTEMPTS} requêtes par minute dépassée pour votre adresse IP (${clientIp}). Veuillez patienter ${retryAfter} secondes.`,
          retryAfterSeconds: retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
