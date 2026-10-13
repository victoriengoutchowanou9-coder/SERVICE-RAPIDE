import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advertisement } from '../../../entities';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Advertisement)
    private readonly adsRepo: Repository<Advertisement>,
  ) {}

  /**
   * Récupère les publicités actives (filtrables par pays ou pour toute l'Afrique)
   */
  async getActiveAds(countryCode?: string) {
    const query = this.adsRepo.createQueryBuilder('ad')
      .where('ad.isActive = :isActive', { isActive: true });

    if (countryCode) {
      query.andWhere('(ad.targetCountryCode = :countryCode OR ad.targetCountryCode IS NULL OR ad.targetCountryCode = :all)', {
        countryCode,
        all: 'ALL',
      });
    }

    const ads = await query.orderBy('ad.createdAt', 'DESC').getMany();

    // Incrémente le compteur de vues
    for (const ad of ads) {
      ad.viewsCount += 1;
      await this.adsRepo.save(ad);
    }

    return ads;
  }

  /**
   * Clic sur une publicité
   */
  async recordClick(adId: string) {
    const ad = await this.adsRepo.findOne({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Publicité non trouvée');
    ad.clicksCount += 1;
    return this.adsRepo.save(ad);
  }

  /**
   * Créer une annonce / pub (Admin ou Partenaire)
   */
  async createAd(data: Partial<Advertisement>) {
    const ad = this.adsRepo.create(data);
    return this.adsRepo.save(ad);
  }

  /**
   * Modifier / Désactiver
   */
  async updateAd(adId: string, data: Partial<Advertisement>) {
    await this.adsRepo.update(adId, data);
    return this.adsRepo.findOne({ where: { id: adId } });
  }

  /**
   * Supprimer
   */
  async deleteAd(adId: string) {
    return this.adsRepo.delete(adId);
  }
}
