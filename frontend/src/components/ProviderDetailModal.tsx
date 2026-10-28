import React, { useState } from 'react';
import {
  X,
  MapPin,
  Building,
  Truck,
  Lock,
  Unlock,
  Phone,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { ProviderItem } from '../types';

interface ProviderDetailModalProps {
  provider: ProviderItem | null;
  isUnlocked: boolean;
  onClose: () => void;
  onUnlock: (provider: ProviderItem) => void;
  onReportIssue?: (provider: ProviderItem) => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  isUnlocked,
  onClose,
  onUnlock,
  onReportIssue,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!provider) return null;

  const isBusy = provider.availability === 'BUSY';
  const portfolio = provider.portfolioPhotos || [];
  const pricingTiers = provider.pricingTiers || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* EN-TÊTE MODALE */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={
                  provider.photoUrl ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                }
                alt={provider.singleName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white ${
                  isBusy ? 'bg-rose-600' : 'bg-emerald-600 animate-pulse'
                }`}
                title={isBusy ? 'Occupé' : 'Disponible MAINTENANT'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-black text-slate-900">
                  {isUnlocked && provider.contact?.fullName ? provider.contact.fullName : provider.singleName}
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isBusy ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                  <span>{isBusy ? 'Occupé' : 'Disponible MAINTENANT'}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-brand-600 mt-0.5">{provider.serviceOffered}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {provider.city}
                  {provider.commune ? `, ${provider.commune}` : ''}
                  {provider.department ? ` (${provider.department})` : ''}
                  {provider.country ? ` • ${provider.country}` : ''}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* COMPÉTENCES / SPÉCIALITÉS */}
        {provider.skills && provider.skills.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Spécialités & Compétences</h4>
            <div className="flex flex-wrap gap-1.5">
              {provider.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-semibold bg-brand-50 text-brand-800 px-3 py-1 rounded-xl border border-brand-200/50"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* GALERIE DE PHOTOS DU PRESTATAIRE ("VOIR SES PHOTOS") */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-brand-600" />
              <span>Galerie de Réalisations ({portfolio.length})</span>
            </h4>
            <span className="text-[10px] text-slate-400">Photos de travaux et d'ateliers</span>
          </div>

          {portfolio.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {portfolio.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(imgUrl)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer shadow-2xs hover:shadow-md transition"
                >
                  <img
                    src={imgUrl}
                    alt={`Réalisation ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                    <span>Agrandir</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 space-y-1">
              <ImageIcon className="w-6 h-6 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Aucune photo de réalisation pour le moment</p>
              <p className="text-[10px] text-slate-400">Le prestataire n'a pas encore ajouté d'images à sa galerie.</p>
            </div>
          )}
        </div>

        {/* MODAL PHOTO AGRANDIE */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
              <img
                src={selectedPhoto}
                alt="Photo agrandie"
                className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* SECTION DÉPLACEMENT & ACCUEIL DU CLIENT */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-slate-600" />
            <span>Déplacement & Modalités d'Intervention</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  provider.travelRequired ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">
                  {provider.travelRequired ? 'Se déplace chez le client' : 'Ne se déplace pas'}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {provider.travelRequired
                    ? provider.travelFee && provider.travelFee > 0
                      ? `Frais de déplacement : ${provider.travelFee.toLocaleString()} FCFA`
                      : 'Déplacement inclus / offert dans sa zone'
                    : 'Le prestataire intervient uniquement dans son propre atelier / local.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  provider.receivesOnSite ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">
                  {provider.receivesOnSite ? 'Accueil sur place (Le client peut venir)' : 'Pas d’accueil sur place'}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {provider.receivesOnSite
                    ? 'Vous pouvez vous déplacer à son atelier, bureau ou local professionnel.'
                    : 'Le prestataire ne dispose pas de local pour recevoir le public.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION TARIFICATION DÉTAILLÉE (HEURE, JOURNÉE, FORFAITS) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>💰</span>
              <span>Grille Tarifaire Indicative</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sans commission Service Rapide
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tarif de base */}
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Tarif de Base
              </span>
              <p className="text-sm sm:text-base font-black text-emerald-950 mt-0.5">
                {(provider.basePrice || 5000).toLocaleString()} FCFA
              </p>
              <p className="text-[10px] text-emerald-700 mt-0.5">/ {provider.pricingUnit || 'prestation'}</p>
            </div>

            {/* Tarif à l'heure */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Tarif à l'heure</span>
              </span>
              <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {provider.hourlyRate ? `${provider.hourlyRate.toLocaleString()} FCFA` : 'Sur devis'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">/ heure de travail</p>
            </div>

            {/* Tarif à la journée */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Tarif à la journée</span>
              </span>
              <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {provider.dailyRate ? `${provider.dailyRate.toLocaleString()} FCFA` : 'Sur devis'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">/ jour d'intervention</p>
            </div>
          </div>

          {/* Tarifs spécifiques / Forfaits personnalisés */}
          {pricingTiers.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Autres formules & tarifs spécifiques :</p>
              <div className="space-y-1.5">
                {pricingTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">{tier.name}</span>
                    <span className="font-black text-emerald-700">
                      {tier.price.toLocaleString()} FCFA
                      {tier.unit ? ` / ${tier.unit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION COORDONNÉES (STRICTEMENT MASQUÉES AVANT DÉBLOCAGE) */}
        <div className="p-4 sm:p-5 rounded-2xl border transition space-y-3 bg-gradient-to-r from-brand-500/5 via-brand-50/50 to-white border-brand-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Unlock className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  {isUnlocked ? 'Coordonnées Débloquées' : 'Coordonnées Directes Masquées'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isUnlocked
                    ? 'Vous avez débloqué les numéros personnels de ce prestataire.'
                    : 'Le numéro de téléphone direct et le lien WhatsApp restent masqués.'}
                </p>
              </div>
            </div>

            {isUnlocked && onReportIssue && (
              <button
                type="button"
                onClick={() => onReportIssue(provider)}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline"
              >
                Signaler un litige
              </button>
            )}
          </div>

          {/* SI DÉBLOQUÉ : Affichage des boutons d'appel et de WhatsApp */}
          {isUnlocked ? (
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-emerald-200">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{provider.contact?.directPhone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2">
                {provider.contact?.directPhone && (
                  <a
                    href={`tel:${provider.contact.directPhone}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex-1 sm:flex-initial"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appeler</span>
                  </a>
                )}
                {provider.contact?.whatsappNumber && (
                  <a
                    href={`https://wa.me/${provider.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex-1 sm:flex-initial"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* SI NON DÉBLOQUÉ : Encadré sécurisé + Bouton Débloquer */
            <div className="pt-2 border-t border-brand-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700">Mise en relation directe : 1 000 FCFA</p>
                <p className="text-[10px] text-slate-500">Paiement unitaire sécurisé Mobile Money via SasPay.</p>
              </div>
              <button
                type="button"
                onClick={() => onUnlock(provider)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Débloquer ce contact (1 000 FCFA)</span>
              </button>
            </div>
          )}
        </div>

        {/* PIED DE MODALE */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Fermer le profil
          </button>
        </div>
      </div>
    </div>
  );
};
