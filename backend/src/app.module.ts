import { Module } from '@nestjs/common';
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
} from './entities';
import { AuthModule } from './modules/auth/auth.module';
import { ProviderModule } from './modules/provider/provider.module';
import { ClientModule } from './modules/client/client.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdsModule } from './modules/ads/ads.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'service_rapide_db'),
        entities: [
          User,
          ProviderProfile,
          ContactUnlock,
          Payment,
          RefundRequest,
          Advertisement,
          SystemSetting,
        ],
        synchronize: true, // Idéal pour le développement / initialisation automatique des tables
        logging: false,
      }),
    }),
    AuthModule,
    ProviderModule,
    ClientModule,
    PaymentModule,
    AdsModule,
    AdminModule,
  ],
})
export class AppModule {}
