import React, { useState } from 'react';
import { Sparkles, ExternalLink, Megaphone, Calendar, Clock, CreditCard, RotateCcw, AlertCircle } from 'lucide-react';
import { AdItem } from '../types';
import { saspayClient } from '../config/saspay';

export const INITIAL_ADS: AdItem[] = [
  {
    id: 'ad-sample-1',
    title: 'Quincaillerie & Matériaux Pro Panafrique',
    content: 'Bénéficiez de 15% de réduction sur tout le gros outillage et la livraison gratuite sur vos chantiers.',
    advertiser: 'Quincaillerie BTP Afrique',
    tag: 'Sponsorisé • Outillage',
    targetUrl: 'https://wa.me/',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    durationWeeks: 4,
    amountPaid: 4000,
    startDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
  },
];

interface AdsSectionProps {
  compact?: boolean;
  currentUser?: any;
}

export const AdsSection: React.FC<AdsSectionProps> = ({ compact = false, currentUser }) => {
  const [ads, setAds] = useState<AdItem[]>(() => {
    try {
      const saved = localStorage.getItem('sr_active_ads');
      return saved ? JSON.parse(saved) : INITIAL_ADS;
    } catch {
      return INITIAL_ADS;
    }
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renewingAd, setRenewingAd] = useState<AdItem | null>(null);

  // Champs de création
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAdvertiser, setNewAdvertiser] = useState(
    currentUser?.providerProfile?.singleName ||
    currentUser?.firstName ||
    ''
  );
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newTag, setNewTag] = useState('Offre Spéciale');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tarification stricte : 1 000 FCFA par semaine
  const priceCalculated = durationWeeks * 1000;

  // Sauvegarde des pubs
  const saveAds = (updatedAds: AdItem[]) => {
    setAds(updatedAds);
    try {
      localStorage.setItem('sr_active_ads', JSON.stringify(updatedAds));
    } catch (e) {
      // Ignorer
    }
  };

  // Lancement du paiement Mobile Money SasPay pour la publicité
  const handlePayAndCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMsg('Veuillez renseigner le titre et la description de votre annonce.');
      return;
    }

    setLoadingPayment(true);

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationWeeks * 7 * 24 * 3600 * 1000);

      const targetAdId = renewingAd ? renewingAd.id : `ad-${Date.now()}`;

      // Initialisation du checkout SasPay côté serveur avec métadonnées publicitaires
      const checkoutUrl = await saspayClient.createCheckoutSession({
        amount: priceCalculated,
        currency: 'XOF',
        customer_name: newAdvertiser || currentUser?.firstName || 'Annonceur SERVICE RAPIDE',
        customer_email: currentUser?.email || 'annonceur@servicerapide.africa',
        customer_phone: currentUser?.phoneNumber || '',
        metadata: {
          action: 'AD_PUBLICATION',
          type: 'AD',
          adId: targetAdId,
          durationWeeks,
          amount: priceCalculated,
          title: newTitle.trim(),
          content: newContent.trim(),
          advertiser: newAdvertiser.trim(),
          targetUrl: newTargetUrl.trim(),
          imageUrl: newImageUrl.trim(),
          userId: currentUser?.id,
        },
      });

      // Enregistrement optimiste local avec statut activé après redirection SasPay
      const newAdObj: AdItem = {
        id: targetAdId,
        title: newTitle.trim(),
        content: newContent.trim(),
        advertiser: newAdvertiser.trim() || 'Partenaire SERVICE RAPIDE',
        tag: `Sponsorisé • ${newTag}`,
        targetUrl: newTargetUrl.trim() || '#',
        imageUrl:
          newImageUrl.trim() ||
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
        durationWeeks,
        amountPaid: priceCalculated,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'ACTIVE',
        userId: currentUser?.id,
      };

      if (renewingAd) {
        saveAds(ads.map((a) => (a.id === renewingAd.id ? newAdObj : a)));
      } else {
        saveAds([newAdObj, ...ads]);
      }

      // Redirection vers le paiement Mobile Money SasPay
      if (typeof window !== 'undefined' && checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error('Erreur initialisation paiement publicité:', err);
      setErrorMsg(err.message || 'Impossible d’initialiser le paiement Mobile Money SasPay.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleOpenRenew = (ad: AdItem) => {
    setRenewingAd(ad);
    setNewTitle(ad.title);
    setNewContent(ad.content);
    setNewAdvertiser(ad.advertiser);
    setNewTargetUrl(ad.targetUrl || '');
    setNewImageUrl(ad.imageUrl || '');
    setDurationWeeks(ad.durationWeeks || 1);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-5">
      {/* En-tête du module publicitaire */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white rounded-3xl p-5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Tarif Fixe : 1 000 FCFA / Semaine
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Campagnes & Publicités Panafricaines
            </h3>
            <p className="text-xs text-slate-600">
              Diffusez votre entreprise, vos promotions et vos services auprès de milliers de clients.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRenewingAd(null);
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-amber-500/25 transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Créer une publicité payante</span>
        </button>
      </div>

      {/* Grille des publicités actives */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {ads.length === 0 ? (
          <div className="col-span-full p-8 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Aucune publicité en cours de diffusion.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Publiez votre première annonce dès 1 000 FCFA / semaine via SasPay.
            </p>
          </div>
        ) : (
          ads.map((ad) => {
            const isExpired = ad.endDate ? new Date(ad.endDate) < new Date() : false;
            const endFormatted = ad.endDate ? new Date(ad.endDate).toLocaleDateString() : '';

            return (
              <div
                key={ad.id}
                className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {ad.imageUrl && (
                    <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>{ad.tag}</span>
                      </div>

                      {/* Badge Statut */}
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs ${
                            isExpired
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {isExpired ? 'Expirée' : 'Diffusée en direct'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {ad.advertiser}
                      </p>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-1 mt-0.5 group-hover:text-brand-600 transition">
                        {ad.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {ad.content}
                      </p>
                    </div>

                    {/* Données de diffusion et facturation */}
                    {ad.amountPaid && (
                      <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 text-[10px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-700">
                          <span>Montant payé :</span>
                          <span className="text-emerald-700 font-black">{ad.amountPaid.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Durée de visibilité :</span>
                          <span className="font-bold text-slate-800">{ad.durationWeeks || 1} semaine(s)</span>
                        </div>
                        {endFormatted && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Fin de diffusion :</span>
                            <span className="font-bold text-slate-800">{endFormatted}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-1 space-y-2">
                  {ad.targetUrl && (
                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition"
                    >
                      <span>Consulter l'offre</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}

                  {/* Bouton Renouveler */}
                  <button
                    type="button"
                    onClick={() => handleOpenRenew(ad)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200 text-[11px] font-black transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Prolonger / Renouveler la pub</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CRÉATION / RENOUVELLEMENT DE PUBLICITÉ AVEC PAIEMENT SASPAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {renewingAd ? 'Prolonger ma publicité' : 'Créer une publicité sponsorisée'}
                  </h3>
                  <p className="text-[11px] text-slate-500">1 000 FCFA par semaine de visibilité garantie</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setRenewingAd(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePayAndCreateAd} className="space-y-3.5">
              {/* Choix de la durée et tarification */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Durée de visibilité souhaitée *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { weeks: 1, label: '1 sem. (7j)', price: '1 000' },
                    { weeks: 2, label: '2 sem. (14j)', price: '2 000' },
                    { weeks: 3, label: '3 sem. (21j)', price: '3 000' },
                    { weeks: 4, label: '4 sem. (28j)', price: '4 000' },
                  ].map((tier) => (
                    <button
                      key={tier.weeks}
                      type="button"
                      onClick={() => setDurationWeeks(tier.weeks)}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                        durationWeeks === tier.weeks
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <span className="text-[11px]">{tier.label}</span>
                      <span className="text-xs font-black text-amber-600 mt-0.5">{tier.price} FCFA</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Total calculé côté serveur */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Montant total à régler
                  </span>
                  <p className="text-xs text-amber-900 font-medium">
                    Calculé selon la formule : {durationWeeks} semaine(s) × 1 000 FCFA
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-950">{priceCalculated.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nom de votre entreprise, atelier ou marque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Électro-Froid Express, Atelier Couture..."
                  value={newAdvertiser}
                  onChange={(e) => setNewAdvertiser(e.target.value)}
                  className="w-full min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Titre accrocheur de l'annonce *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réparation express à domicile - Devis gratuit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="Offre Spéciale">Offre Spéciale</option>
                    <option value="Artisanat & Réparation">Artisanat & Réparation</option>
                    <option value="BTP & Quincaillerie">BTP & Quincaillerie</option>
                    <option value="Finance & Mobile Money">Finance & Mobile Money</option>
                    <option value="Véhicules & Dépannage">Véhicules & Dépannage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lien WhatsApp ou Site Web (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="https://wa.me/..."
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    className="w-full min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description détaillée de l'offre *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Détaillez vos prestations, garanties et coordonnées..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  URL Photo ou bannière publicitaire (Optionnel)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setRenewingAd(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingPayment}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {loadingPayment
                      ? 'Connexion SasPay...'
                      : `Payer via SasPay (${priceCalculated.toLocaleString()} FCFA)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
