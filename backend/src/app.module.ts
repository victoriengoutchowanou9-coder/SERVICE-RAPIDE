import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  ProviderProfile,
  ContactUnlock,
  Payment,
  RefundRequest,
  Advertisement,
  SystemSetting,
  ProviderPost,
} from './entities';
import { AuthModule } from './modules/auth/auth.module';
import { ProviderModule } from './modules/provider/provider.module';
import { ClientModule } from './modules/client/client.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdsModule } from './modules/ads/ads.module';
import { AdminModule } from './modules/admin/admin.module';

// Middlewares
import { AuthRateLimitMiddleware } from './common/middlewares/auth-rate-limit.middleware';
import { UserActivationMiddleware } from './common/middlewares/user-activation.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'aws-0-eu-west-1.pooler.supabase.com'),
        port: config.get<number>('DB_PORT', 6543),
        username: config.get<string>('DB_USERNAME', 'postgres.gsgbvoyddagpjldgeyqk'),
        password: config.get<string>('DB_PASSWORD', 'BI6PbBYPGqNFppwx'),
        database: config.get<string>('DB_NAME', 'postgres'),
        ssl:
          config.get<string>('DB_SSL') === 'true' ||
          config.get<string>('DB_HOST', '').includes('supabase.com')
            ? { rejectUnauthorized: false }
            : false,
        entities: [
          User,
          ProviderProfile,
          ContactUnlock,
          Payment,
          RefundRequest,
          Advertisement,
          SystemSetting,
          ProviderPost,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    ProviderModule,
    ClientModule,
    PaymentModule,
    AdsModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. RATE LIMITING SUR TOUTES LES ROUTES D'AUTHENTIFICATION (4 tentatives / min / IP)
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: 'auth/login-or-register', method: RequestMethod.POST },
        { path: 'auth/verify-otp', method: RequestMethod.POST },
        { path: 'auth/resend-otp', method: RequestMethod.POST },
      );

    // 2. CHECK D'ACTIVATION UTILISATEUR SUR TOUTES LES ROUTES PROTÉGÉES
    consumer
      .apply(UserActivationMiddleware)
      .forRoutes(
        { path: 'provider/*', method: RequestMethod.ALL },
        { path: 'client/*', method: RequestMethod.ALL },
        { path: 'payments/*', method: RequestMethod.ALL },
        { path: 'admin/*', method: RequestMethod.ALL },
        { path: 'auth/choose-role', method: RequestMethod.POST },
        { path: 'auth/preferences', method: RequestMethod.PATCH },
        { path: 'auth/me', method: RequestMethod.GET },
      );
  }
}
