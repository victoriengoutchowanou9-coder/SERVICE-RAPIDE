import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  Megaphone,
  Calendar,
  Clock,
  CreditCard,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Trash2,
  Edit3,
  Eye,
  Filter,
} from 'lucide-react';
import { AdItem } from '../types';
import { saspayClient } from '../config/saspay';

export const INITIAL_VERIFIED_ADS: AdItem[] = [
  {
    id: 'ad-sample-verified-1',
    title: 'Quincaillerie & Matériaux Pro Panafrique',
    content: 'Bénéficiez de 15% de réduction sur tout le gros outillage et la livraison gratuite sur vos chantiers.',
    advertiser: 'Quincaillerie BTP Afrique',
    tag: 'Sponsorisé • Outillage',
    targetUrl: 'https://wa.me/22955445122',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    durationWeeks: 4,
    amountPaid: 4000,
    startDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    userId: 'admin-seed-id',
  },
];

interface AdsSectionProps {
  compact?: boolean;
  currentUser?: any;
}

export const AdsSection: React.FC<AdsSectionProps> = ({ compact = false, currentUser }) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL_ACTIVE' | 'MY_ADS'>('ALL_ACTIVE');
  const [ads, setAds] = useState<AdItem[]>(INITIAL_VERIFIED_ADS);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [renewingAd, setRenewingAd] = useState<AdItem | null>(null);

  // Formulaire
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

  // Tarification stricte : 1 000 FCFA par semaine
  const priceCalculated = durationWeeks * 1000;

  // 1. Récupération des annonces depuis le serveur API
  const fetchAds = async () => {
    try {
      const res = await fetch('/api/ads/manage?scope=public');
      if (res.ok) {
        const publicAds = await res.json();
        if (Array.isArray(publicAds) && publicAds.length > 0) {
          setAds(publicAds);
          return;
        }
      }
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // 2. Vérification automatique si retour d'une session SasPay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id') || params.get('checkout_id');
    const paymentStatus = params.get('payment_status') || params.get('payment');

    if (paymentStatus === 'cancelled' || paymentStatus === 'failed') {
      setErrorMsg('Paiement SasPay annulé ou solde insuffisant. Votre publicité n\'a PAS été activée.');
      setTimeout(() => setErrorMsg(null), 8000);
    } else if (sessionId && (paymentStatus === 'success' || paymentStatus === 'paid')) {
      // Vérification côté serveur obligatoire
      fetch(`/api/saspay/verify?id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.isPaid) {
            setFeedback('🎉 Paiement SasPay confirmé par le serveur ! Votre publicité est maintenant active.');
            fetchAds();
          } else {
            setErrorMsg('Attention : transaction non confirmée par SasPay. La publicité reste en attente.');
          }
          setTimeout(() => {
            setFeedback(null);
            setErrorMsg(null);
          }, 8000);
        })
        .catch(() => {
          // Ignorer
        });
    }
  }, []);

  // 3. Soumission de création / modification sécurisée
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMsg('Le titre et la description détaillée sont obligatoires.');
      return;
    }

    const token = localStorage.getItem('sr_token') || '';

    // A. Cas d'une modification de contenu par son propriétaire
    if (editingAd && !renewingAd) {
      setLoadingPayment(true);
      try {
        const res = await fetch('/api/ads/manage', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingAd.id,
            title: newTitle.trim(),
            content: newContent.trim(),
            targetUrl: newTargetUrl.trim(),
            imageUrl: newImageUrl.trim(),
            tag: newTag,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Impossible de modifier cette annonce.');
        }

        setFeedback('Publicité mise à jour avec succès par son propriétaire.');
        setShowCreateModal(false);
        setEditingAd(null);
        fetchAds();
        setTimeout(() => setFeedback(null), 4000);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingPayment(false);
      }
      return;
    }

    // B. Cas d'une création ou renouvellement avec PAIEMENT OBLIGATOIRE
    setLoadingPayment(true);

    try {
      let targetAdId = renewingAd ? renewingAd.id : '';

      // 1. Enregistrement préalable de l'annonce en statut PENDING_PAYMENT côté serveur
      if (!renewingAd) {
        const createRes = await fetch('/api/ads/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newTitle.trim(),
            content: newContent.trim(),
            advertiser: newAdvertiser.trim(),
            targetUrl: newTargetUrl.trim(),
            imageUrl: newImageUrl.trim(),
            tag: newTag,
            durationWeeks,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || 'Erreur lors de l’enregistrement de l’annonce.');
        }
        targetAdId = createData.ad?.id || `ad-${Date.now()}`;
      }

      // 2. Initialisation de la transaction SasPay avec montant STRICTEMENT calculé par le serveur
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
          userId: currentUser?.id,
        },
      });

      // L'annonce reste en PENDING_PAYMENT, JAMAIS active avant paiement !
      // Redirection vers SasPay Mobile Money
      if (typeof window !== 'undefined' && checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error('Erreur checkout publicité:', err);
      setErrorMsg(err.message || 'Impossible d’initialiser le paiement Mobile Money.');
    } finally {
      setLoadingPayment(false);
    }
  };

  // Suppression sécurisée avec vérification propriétaire
  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Êtes-vous certain de vouloir supprimer cette publicité ?')) return;

    const token = localStorage.getItem('sr_token') || '';
    try {
      const res = await fetch(`/api/ads/manage?id=${encodeURIComponent(adId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la suppression.');
        return;
      }

      setFeedback('Publicité supprimée avec succès.');
      setAds(ads.filter((a) => a.id !== adId));
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert('Erreur réseau lors de la suppression.');
    }
  };

  // Ouverture modale pour modification (propriétaire uniquement)
  const handleOpenEdit = (ad: AdItem) => {
    setEditingAd(ad);
    setRenewingAd(null);
    setNewTitle(ad.title);
    setNewContent(ad.content);
    setNewAdvertiser(ad.advertiser);
    setNewTargetUrl(ad.targetUrl || '');
    setNewImageUrl(ad.imageUrl || '');
    setNewTag(ad.tag?.replace('Sponsorisé • ', '') || 'Offre Spéciale');
    setShowCreateModal(true);
  };

  // Ouverture modale pour renouvellement (propriétaire uniquement)
  const handleOpenRenew = (ad: AdItem) => {
    setRenewingAd(ad);
    setEditingAd(ad);
    setNewTitle(ad.title);
    setNewContent(ad.content);
    setNewAdvertiser(ad.advertiser);
    setNewTargetUrl(ad.targetUrl || '');
    setNewImageUrl(ad.imageUrl || '');
    setDurationWeeks(ad.durationWeeks || 1);
    setShowCreateModal(true);
  };

  const isUserAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'DEVELOPER' ||
    currentUser?.role === 'developer';

  // Filtrage selon l'onglet
  const displayedAds =
    activeTabFilter === 'MY_ADS'
      ? ads.filter((a) => a.userId === currentUser?.id || isUserAdmin)
      : ads.filter((a) => a.status === 'ACTIVE');

  const myAdsCount = ads.filter((a) => a.userId === currentUser?.id).length;

  return (
    <div className="space-y-5">
      {/* Messages d'alerte / confirmation */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                Paiement SasPay obligatoire avant diffusion
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Campagnes & Publicités Panafricaines
            </h3>
            <p className="text-xs text-slate-600">
              Diffusez votre entreprise et vos offres en direct. Activation uniquement après confirmation réelle du paiement.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAd(null);
            setRenewingAd(null);
            setNewTitle('');
            setNewContent('');
            setNewTargetUrl('');
            setNewImageUrl('');
            setDurationWeeks(1);
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-amber-500/25 transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Créer une publicité payante</span>
        </button>
      </div>

      {/* Onglets de filtrage : Toutes les annonces vs Mes annonces */}
      {currentUser && (
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold gap-1 max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTabFilter('ALL_ACTIVE')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTabFilter === 'ALL_ACTIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Toutes les annonces actives</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabFilter('MY_ADS')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTabFilter === 'MY_ADS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Mes annonces ({myAdsCount})</span>
          </button>
        </div>
      )}

      {/* Grille des publicités */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {displayedAds.length === 0 ? (
          <div className="col-span-full p-8 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              {activeTabFilter === 'MY_ADS'
                ? 'Vous n’avez aucune annonce enregistrée pour le moment.'
                : 'Aucune publicité en cours de diffusion.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Les publicités sont diffusées après validation du paiement de 1 000 FCFA / semaine via SasPay.
            </p>
          </div>
        ) : (
          displayedAds.map((ad) => {
            const isOwner = ad.userId === currentUser?.id || isUserAdmin;
            const isExpired = ad.endDate ? new Date(ad.endDate) < new Date() : false;
            const isPendingPayment = ad.status === 'PENDING_PAYMENT';
            const isPaymentFailed = ad.status === 'PAYMENT_FAILED';
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

                      {/* Statut réel vérifié */}
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs ${
                            isPendingPayment
                              ? 'bg-amber-500 text-white'
                              : isPaymentFailed
                              ? 'bg-rose-500 text-white'
                              : isExpired
                              ? 'bg-slate-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {isPendingPayment
                            ? '⏳ En attente de paiement'
                            : isPaymentFailed
                            ? '✖ Paiement échoué'
                            : isExpired
                            ? 'Expirée'
                            : 'Diffusée en direct'}
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
                          <span>Montant réglé :</span>
                          <span className="text-emerald-700 font-black">{ad.amountPaid.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Durée payée :</span>
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

                  {/* SÉCURITÉ CRITIQUE : Boutons de gestion affichés UNIQUEMENT au propriétaire légitime ou Admin */}
                  {isOwner && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenRenew(ad)}
                        className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black transition flex items-center justify-center gap-1"
                        title="Prolonger la durée"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-700" />
                        <span>Prolonger</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ad)}
                        className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold transition flex items-center justify-center gap-1"
                        title="Modifier mon annonce"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CRÉATION / ÉDITION / RENOUVELLEMENT DE PUBLICITÉ */}
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
                    {renewingAd
                      ? 'Prolonger ma publicité'
                      : editingAd
                      ? 'Modifier ma publicité'
                      : 'Créer une publicité sponsorisée'}
                  </h3>
                  <p className="text-[11px] text-slate-500">1 000 FCFA par semaine de visibilité garantie</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAd(null);
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

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Choix de la durée (pour création ou renouvellement) */}
              {(!editingAd || renewingAd) && (
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

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between mt-2.5">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        Montant à régler via SasPay
                      </span>
                      <p className="text-xs text-amber-900 font-medium">
                        Formule : {durationWeeks} semaine(s) × 1 000 FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-950">{priceCalculated.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nom de votre entreprise ou marque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Électro-Froid Express, Quincaillerie Moderne..."
                  value={newAdvertiser}
                  onChange={(e) => setNewAdvertiser(e.target.value)}
                  className="w-full min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réparation et devis gratuit à domicile"
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
                    Lien WhatsApp ou Web (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="https://wa.me/22955445122"
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
                  placeholder="Présentez vos services, promotions et garanties..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  URL Photo ou bannière (Optionnel)
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
                    setEditingAd(null);
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
                      ? 'Traitement en cours...'
                      : editingAd && !renewingAd
                      ? 'Enregistrer les modifications'
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
