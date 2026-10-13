import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Advertisement } from '../../entities';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Advertisement])],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
