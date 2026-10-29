import React, { useState, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  Heart,
  MapPin,
  Sparkles,
  MessageCircle,
  Rss,
  Megaphone,
  ExternalLink,
  CheckCircle2,
  PlusCircle,
  Globe,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { PostItem, AdItem } from '../types';
import { INITIAL_VERIFIED_ADS } from './AdsSection';
import { saspayClient } from '../config/saspay';

interface FeedPostsProps {
  userRole: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  currentUser: any;
  posts: PostItem[];
  onAddPost: (post: Partial<PostItem>) => void;
  onOpenAds?: () => void;
}

export const FeedPosts: React.FC<FeedPostsProps> = ({
  userRole,
  currentUser,
  posts,
  onAddPost,
  onOpenAds,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImgInput, setShowImgInput] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Publicités actives dans le fil
  const [ads, setAds] = useState<AdItem[]>(INITIAL_VERIFIED_ADS);
  const [loadingAds, setLoadingAds] = useState(false);

  // Modal de création rapide de publicité depuis le fil d'actualité
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adContent, setAdContent] = useState('');
  const [adAdvertiser, setAdAdvertiser] = useState(
    currentUser?.providerProfile?.singleName || currentUser?.firstName || ''
  );
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adTag, setAdTag] = useState('Offre Spéciale');
  const [adWeeks, setAdWeeks] = useState(1);
  const [loadingAdPayment, setLoadingAdPayment] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  const isProvider = userRole === 'PROVIDER';

  // 1. Chargement des publicités actives depuis l'API pour les afficher à tous les utilisateurs
  const fetchAds = async () => {
    try {
      setLoadingAds(true);
      const res = await fetch('/api/ads/manage?scope=public');
      if (res.ok) {
        const publicAds = await res.json();
        if (Array.isArray(publicAds) && publicAds.length > 0) {
          // Fusion des publicités vérifiées et des publicités en base de données
          const combined = [...publicAds];
          for (const sample of INITIAL_VERIFIED_ADS) {
            if (!combined.some((a) => a.id === sample.id || a.title === sample.title)) {
              combined.push(sample);
            }
          }
          setAds(combined);
          return;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement publicités du fil:', e);
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddPost({
      content,
      imageUrl: imageUrl.trim() || undefined,
      authorId: currentUser?.id || 'demo-provider',
      authorSingleName:
        currentUser?.providerProfile?.singleName || currentUser?.firstName || 'Prestataire',
      authorPhotoUrl:
        currentUser?.providerProfile?.photoUrl ||
        currentUser?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      authorService: currentUser?.providerProfile?.serviceOffered || 'Prestation Spécialisée',
      city: currentUser?.providerProfile?.city || 'Cotonou',
      department: currentUser?.providerProfile?.department || 'Littoral',
      mapLocationHint: `Zone ${currentUser?.providerProfile?.department || 'Centre'} • Disponible`,
    });

    setContent('');
    setImageUrl('');
    setShowImgInput(false);
  };

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Création d'une publicité sponsorisée avec SasPay Mobile Money
  const handleCreateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdError(null);

    if (!adTitle.trim() || !adContent.trim()) {
      setAdError('Le titre et la description de votre publicité sont obligatoires.');
      return;
    }

    const token = localStorage.getItem('sr_token') || '';
    if (!token) {
      setAdError('Veuillez vous reconnecter pour créer une publicité.');
      return;
    }

    const priceCalculated = Math.max(1, adWeeks) * 1000;
    setLoadingAdPayment(true);

    try {
      // 1. Enregistrement préalable de l'annonce en statut PENDING_PAYMENT
      const createRes = await fetch('/api/ads/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: adTitle.trim(),
          content: adContent.trim(),
          advertiser: adAdvertiser.trim() || currentUser?.firstName || 'Annonceur',
          targetUrl: adTargetUrl.trim(),
          imageUrl: adImageUrl.trim(),
          tag: adTag,
          durationWeeks: adWeeks,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Erreur lors de l'enregistrement de l'annonce.");
      }

      const targetAdId = createData.ad?.id || `ad-${Date.now()}`;

      // 2. Initialisation SasPay
      const checkoutUrl = await saspayClient.createCheckoutSession({
        amount: priceCalculated,
        currency: 'XOF',
        customer_name: adAdvertiser || currentUser?.firstName || 'Annonceur SERVICE RAPIDE',
        customer_email: currentUser?.email || 'contact@servicerapide.africa',
        customer_phone: currentUser?.phoneNumber || '',
        metadata: {
          action: 'AD_PUBLICATION',
          type: 'AD',
          adId: targetAdId,
          durationWeeks: adWeeks,
          amount: priceCalculated,
          userId: currentUser?.id,
        },
      });

      if (typeof window !== 'undefined' && checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error('Erreur checkout publicité:', err);
      setAdError(err.message || "Impossible d'initialiser le paiement SasPay.");
    } finally {
      setLoadingAdPayment(false);
    }
  };

  // Composant carte publicitaire
  const renderAdCard = (ad: AdItem) => (
    <article
      key={ad.id}
      className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/60 shadow-sm space-y-3 relative overflow-hidden"
    >
      {/* Ruban Sponsorisé & Annonceur */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-slate-900">{ad.advertiser}</h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Publicité Sponsorisée</span>
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              {ad.tag || 'Offre Spéciale'} • Visible par tous les utilisateurs
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
          <Globe className="w-3 h-3 text-blue-600" />
          <span>Diffusion Panafricaine</span>
        </span>
      </div>

      {/* Titre et contenu */}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{ad.title}</h3>
        <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
          {ad.content}
        </p>
      </div>

      {/* Image de la publicité */}
      {ad.imageUrl && (
        <div className="rounded-2xl overflow-hidden bg-slate-100 border border-amber-200/50 max-h-72">
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Pied de la publicité & Bouton d'action */}
      <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <span className="text-[11px] text-amber-950 font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Campagne vérifiée Service Rapide</span>
        </span>

        {ad.targetUrl && (
          <a
            href={ad.targetUrl.startsWith('http') ? ad.targetUrl : `https://${ad.targetUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <span>Découvrir l'offre</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );

  return (
    <div className="space-y-5">
      {/* BANNIÈRE DE PROMOTION PUBLICITAIRE DANS LE FIL (Accessible à TOUS les utilisateurs) */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
            <Megaphone className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Visibilité Immédiate
              </span>
              <span className="text-[10px] font-bold text-amber-100">
                1 000 FCFA / semaine
              </span>
            </div>
            <p className="text-xs sm:text-sm font-black mt-0.5">
              Diffusez votre publicité dans le fil d'actualité, visible par tous les utilisateurs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenAds) {
              onOpenAds();
            } else {
              setShowCreateAdModal(true);
            }
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-amber-950 hover:bg-amber-50 px-4 py-2.5 rounded-xl font-black text-xs shadow-xs transition shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-600" />
          <span>+ Créer une publicité</span>
        </button>
      </div>

      {/* SECTION PUBLICATION PRESTATAIRE (Pour partager des chantiers et conseils) */}
      {isProvider && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3"
        >
          <div className="flex items-start gap-3">
            <img
              src={
                currentUser?.providerProfile?.photoUrl ||
                currentUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt="Profil"
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-brand-500/30 shrink-0"
            />
            <div className="flex-1">
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Partagez une réalisation, une disponibilité ou une astuce technique avec les clients..."
                className="w-full text-xs font-medium placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {showImgInput && (
            <div className="pl-13">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Collez l'URL de votre photo de réalisation (ex: https://...)"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between pl-13 pt-1">
            <button
              type="button"
              onClick={() => setShowImgInput(!showImgInput)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showImgInput ? 'Masquer photo' : 'Ajouter une photo'}</span>
            </button>

            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publier</span>
            </button>
          </div>
        </form>
      )}

      {/* FLUX DE LA FILE D'ACTUALITÉ : PUBLICITÉS & PUBLICATIONS */}
      <div className="space-y-4">
        {/* A. Si des publicités sont actives, la première est mise à l'honneur en tête du fil */}
        {ads.length > 0 && renderAdCard(ads[0])}

        {/* B. Publications des prestataires */}
        {posts.map((post, idx) => {
          const isLiked = likedPosts[post.id];
          const displayLikes = post.likesCount + (isLiked ? 1 : 0);

          return (
            <React.Fragment key={post.id}>
              <article className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        post.authorPhotoUrl ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={post.authorSingleName}
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{post.authorSingleName}</h4>
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                          {post.authorService}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
                          <span>
                            {post.city}
                            {post.department ? `, ${post.department}` : ''}
                          </span>
                        </span>
                        {post.mapLocationHint && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            📍 {post.mapLocationHint}
                          </span>
                        )}
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-medium">{post.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">{post.content}</p>

                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 max-h-72">
                    <img src={post.imageUrl} alt="Réalisation" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition ${
                      isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{displayLikes}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>Discussion</span>
                  </div>
                </div>
              </article>

              {/* Insertion des autres publicités tous les 2 posts */}
              {ads.length > 1 && (idx + 1) % 2 === 0 && ads[Math.floor((idx + 1) / 2)] && (
                renderAdCard(ads[Math.floor((idx + 1) / 2)])
              )}
            </React.Fragment>
          );
        })}

        {/* C. Si d'autres publicités existent et qu'il n'y a pas assez de posts, on les affiche */}
        {ads.slice(posts.length > 0 ? 1 : 1).map((extraAd) => (
          renderAdCard(extraAd)
        ))}

        {/* Si aucune publication artisanale n'est encore enregistrée */}
        {posts.length === 0 && (
          <div className="p-6 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 space-y-1.5">
            <Rss className="w-6 h-6 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">
              Espace d'échange et de réalisations en direct
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Les prestataires locaux peuvent partager leurs chantiers, astuces et disponibilités dans ce fil d'actualité.
            </p>
          </div>
        )}
      </div>

      {/* MODAL CRÉATION DE PUBLICITÉ RAPIDE DEPUIS LE FIL */}
      {showCreateAdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Créer une Publicité Sponsorisée</h4>
                  <p className="text-[10px] text-slate-500">Diffusée dans le fil d'actualité à tous les utilisateurs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAdModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nom de l'Entreprise ou de l'Annonceur *
                </label>
                <input
                  type="text"
                  required
                  value={adAdvertiser}
                  onChange={(e) => setAdAdvertiser(e.target.value)}
                  placeholder="Ex: GESTIO 229, Quincaillerie Moderne..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Titre de l'Offre Publicitaire *
                </label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="Ex: Gérer vos entreprises avec vos portables"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description détaillée de l'offre *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adContent}
                  onChange={(e) => setAdContent(e.target.value)}
                  placeholder="Décrivez votre produit, vos tarifs, vos garanties..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lien Web ou WhatsApp
                  </label>
                  <input
                    type="url"
                    value={adTargetUrl}
                    onChange={(e) => setAdTargetUrl(e.target.value)}
                    placeholder="https://wa.me/229... ou site web"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Photo / Bannière URL
                  </label>
                  <input
                    type="url"
                    value={adImageUrl}
                    onChange={(e) => setAdImageUrl(e.target.value)}
                    placeholder="https://images.unsplash..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span>Durée de diffusion :</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setAdWeeks(w)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                          adWeeks === w
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {w} sem.
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs font-black text-amber-950">
                  <span>Total à payer (SasPay) :</span>
                  <span className="text-sm text-amber-700 font-black">
                    {(adWeeks * 1000).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAdModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingAdPayment}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs transition disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {loadingAdPayment ? 'Connexion SasPay...' : `Payer ${(adWeeks * 1000).toLocaleString()} FCFA`}
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
