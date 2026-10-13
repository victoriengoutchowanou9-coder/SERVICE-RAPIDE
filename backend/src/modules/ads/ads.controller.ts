import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * 5. Section publication et publicité (Accessible à tous / filtrable par pays)
   */
  @Get('active')
  getActiveAds(@Query('countryCode') countryCode?: string) {
    return this.adsService.getActiveAds(countryCode);
  }

  @Post(':id/click')
  clickAd(@Param('id') id: string) {
    return this.adsService.recordClick(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Post()
  createAd(@Body() data: any) {
    return this.adsService.createAd(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Put(':id')
  updateAd(@Param('id') id: string, @Body() data: any) {
    return this.adsService.updateAd(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Delete(':id')
  deleteAd(@Param('id') id: string) {
    return this.adsService.deleteAd(id);
  }
}
