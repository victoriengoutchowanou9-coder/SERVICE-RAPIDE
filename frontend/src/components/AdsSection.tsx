import React from 'react';
import { Sparkles, ExternalLink, Megaphone } from 'lucide-react';
import { AdItem } from '../types';

export const ADS_DATA: AdItem[] = [
  {
    id: 'ad-1',
    title: 'Outillage Pro Bosch & Total Afrique',
    content: 'Jusqu’à -25% sur perceuses, meuleuses et groupes électrogènes livrés dans 15 capitales africaines.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    advertiser: 'Bosch Professional Afrique',
    tag: 'Sponsorisé • Outillage',
    targetUrl: 'https://example.com/bosch-promo',
  },
  {
    id: 'ad-2',
    title: 'Wave & Orange Money : Encaissez vos clients instantanément',
    content: '0% de frais sur vos 10 premiers encaissements de prestations avec le compte Pro.',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    advertiser: 'Mobile Money Pro',
    tag: 'Sponsorisé • Finance',
    targetUrl: 'https://example.com/momo-promo',
  },
  {
    id: 'ad-3',
    title: 'Assurance Sanlam Intervention Chantier & Atelier',
    content: 'Protégez votre travail et couvrez vos clients en cas d’accident technique dès 2 000 FCFA/mois.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    advertiser: 'Sanlam Assurance',
    tag: 'Sponsorisé • Protection',
    targetUrl: 'https://example.com/sanlam-promo',
  },
];

export const AdsSection: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
          <Megaphone className="w-3.5 h-3.5 text-amber-500" />
          <span>Espace Publicités & Partenaires</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          Afrique
        </span>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {ADS_DATA.map((ad) => (
          <div
            key={ad.id}
            className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {ad.imageUrl && (
                <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>{ad.tag}</span>
                  </div>
                </div>
              )}
              <div className="p-3">
                <p className="text-[10px] font-bold text-slate-400">{ad.advertiser}</p>
                <h4 className="text-xs font-black text-slate-900 line-clamp-1 mt-0.5 group-hover:text-brand-600 transition">
                  {ad.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {ad.content}
                </p>
              </div>
            </div>

            <div className="px-3 pb-3 pt-1">
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-[11px] font-bold border border-slate-200 transition"
              >
                <span>En savoir plus</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
