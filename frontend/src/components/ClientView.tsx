import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Lock,
  Unlock,
  MessageCircle,
  Phone,
  AlertCircle,
  Truck,
  Building,
  Sparkles,
  CheckCircle,
  User,
  Rss,
  Megaphone,
  Briefcase,
  Star,
  Clock,
  Zap,
  Calendar,
  LifeBuoy,
  CreditCard,
  CheckCircle2,
  ListFilter,
  ArrowUpDown,
  LogOut,
  Eye,
} from 'lucide-react';
import { ProviderItem, PostItem, ServiceRequest } from '../types';
import { AdsSection } from './AdsSection';
import { FeedPosts } from './FeedPosts';
import { ClientProfileModal } from './ClientProfileModal';
import { SupportModal } from './SupportModal';
import { ProviderDetailModal } from './ProviderDetailModal';
import { saspayClient } from '../config/saspay';
import { supabaseBackend } from '../config/supabase';

interface ClientViewProps {
  user: any;
  token: string;
  country: string;
  posts: PostItem[];
  providers?: ProviderItem[];
  serviceRequests?: ServiceRequest[];
  onAddPost: (post: Partial<PostItem>) => void;
  onUpdateUser: (updatedUser: any) => void;
  onAddServiceRequest?: (req: Partial<ServiceRequest>) => void;
  onSubmitReview?: (providerId: string, rating: number, comment: string) => void;
  onLogout?: () => void;
  activeSectionOverride?: string;
}

export const ClientView: React.FC<ClientViewProps> = ({
  user,
  token,
  country,
  posts,
  providers: externalProviders,
  serviceRequests: externalRequests,
  onAddPost,
  onUpdateUser,
  onAddServiceRequest,
  onSubmitReview,
  onLogout,
  activeSectionOverride,
}) => {
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'REQUESTS' | 'FEED' | 'ADS'>(() => {
    try {
      const saved = sessionStorage.getItem('sr_client_tab');
      if (saved === 'PROVIDERS' || saved === 'REQUESTS' || saved === 'FEED' || saved === 'ADS') return saved;
    } catch {}
    return 'PROVIDERS';
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Persister l'onglet actif dans sessionStorage
  React.useEffect(() => {
    try { sessionStorage.setItem('sr_client_tab', activeTab); } catch {}
  }, [activeTab]);

  React.useEffect(() => {
    if (!activeSectionOverride) return;
    if (activeSectionOverride === 'PROFILE') {
      setShowProfileModal(true);
    } else if (activeSectionOverride === 'BOOKINGS' || activeSectionOverride === 'REQUESTS') {
      setActiveTab('REQUESTS');
    } else if (activeSectionOverride === 'PROVIDERS' || activeSectionOverride === 'FEED' || activeSectionOverride === 'ADS') {
      setActiveTab(activeSectionOverride as any);
    }
  }, [activeSectionOverride]);

  // Modales d'action
  const [selectedDetailProvider, setSelectedDetailProvider] = useState<ProviderItem | null>(null);
  const [unlockModalProvider, setUnlockModalProvider] = useState<ProviderItem | null>(null);
  const [refundModalItem, setRefundModalItem] = useState<ProviderItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [momoOperator, setMomoOperator] = useState('ORANGE_MONEY');
  const [momoPhone, setMomoPhone] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Recherche & Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [filterAvailableNowOnly, setFilterAvailableNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRICE_ASC' | 'RATING_DESC' | 'MISSIONS_DESC'>('DEFAULT');

  // Contacts débloqués persistés par le client (paiement unitaire de 1 000 FCFA par contact, sans abonnement)
  const [unlockedProviderIds, setUnlockedProviderIds] = useState<string[]>([]);

  // Liste des prestataires enregistrés
  const defaultMockProviders: ProviderItem[] = [];

  const [internalProviders, setInternalProviders] = useState<ProviderItem[]>(defaultMockProviders);
  const currentProviders = (externalProviders && externalProviders.length > 0) ? externalProviders : internalProviders;

  const [internalRequests, setInternalRequests] = useState<ServiceRequest[]>([]);

  // 1. Chargement des prestataires enregistrés depuis l'API pour être visibles par tous les clients
  useEffect(() => {
    const fetchRegisteredProviders = async () => {
      try {
        const provs = await supabaseBackend.getPublicProviders(token);
        if (provs && provs.length > 0) {
          setInternalProviders(provs);
        }
      } catch (e) {
        console.warn('Erreur chargement prestataires:', e);
      }
    };
    fetchRegisteredProviders();
  }, [token]);

  useEffect(() => {
    if (user?.id) {
      supabaseBackend.getContactUnlocks(user.id).then((unlocks) => {
        if (unlocks && unlocks.length > 0) {
          setUnlockedProviderIds(unlocks.map((u: any) => u.providerId));
        }
      });
    }
  }, [user?.id]);

  const currentRequests = externalRequests || internalRequests;
  const clientRequests = currentRequests.filter(
    (r) => r.clientId === user.id || r.clientName.toLowerCase().includes((user.firstName || '').toLowerCase())
  );

  const handleBookingSubmit = (newReq: Partial<ServiceRequest>) => {
    if (onAddServiceRequest) {
      onAddServiceRequest(newReq);
    } else {
      const fullReq: ServiceRequest = {
        id: `req-${Date.now()}`,
        clientId: user.id || 'client-1',
        clientName: `${user.firstName || 'Awa'} ${user.lastName || 'Kouassi'}`.trim(),
        clientPhone: momoPhone || '+22507000000',
        clientAvatar: user.avatarUrl,
        providerId: newReq.providerId || 'prov-1',
        providerSingleName: newReq.providerSingleName || 'Prestataire',
        serviceTitle: newReq.serviceTitle || 'Service',
        description: newReq.description || '',
        mode: newReq.mode || 'IMMEDIATE',
        scheduledDateTime: newReq.scheduledDateTime,
        location: newReq.location || 'Abidjan',
        estimatedPrice: newReq.estimatedPrice || 10000,
        status: 'PENDING',
        paymentMethod: newReq.paymentMethod || 'ORANGE_MONEY',
        createdAt: 'À l’instant',
        hasBeenRated: false,
      };
      setInternalRequests((prev) => [fullReq, ...prev]);
    }

    setActionMsg(
      newReq.mode === 'IMMEDIATE'
        ? '⚡ Demande immédiate transmise au prestataire ! Il a été notifié en direct.'
        : `📅 Demande programmée pour le ${newReq.scheduledDateTime} transmise avec succès !`
    );
    setTimeout(() => setActionMsg(null), 5000);
  };

  const handleReviewSubmit = (provId: string, rating: number, comment: string) => {
    if (onSubmitReview) {
      onSubmitReview(provId, rating, comment);
    } else {
      setInternalProviders((prev) =>
        prev.map((p) => {
          if (p.id === provId) {
            const newRevCount = (p.reviewsCount || 0) + 1;
            const newScore = Number(((p.rating * (p.reviewsCount || 1) + rating) / newRevCount).toFixed(1));
            const newReview = {
              id: `rev-${Date.now()}`,
              clientName: `${user.firstName || 'Client'} ${user.lastName ? user.lastName[0] + '.' : ''}`,
              rating,
              comment,
              date: 'À l’instant',
            };
            return {
              ...p,
              rating: newScore,
              reviewsCount: newRevCount,
              completedMissions: (p.completedMissions || 0) + 1,
              reviews: [newReview, ...(p.reviews || [])],
            };
          }
          return p;
        })
      );
    }

    setActionMsg(`⭐ Merci pour votre évaluation (${rating}/5) ! Le profil du prestataire a été mis à jour.`);
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Déblocage contact : Le client paie 1 000 FCFA par contact de prestataire (sans abonnement)
  const handleConfirmUnlock = async () => {
    if (!unlockModalProvider) return;
    const prov = unlockModalProvider;

    if (prov.availability === 'BUSY') {
      alert('Impossible : Ce prestataire est actuellement OCCUPÉ.');
      return;
    }

    try {
      const checkoutUrl = await saspayClient.createCheckoutSession({
        amount: 1000,
        customer_email: user?.email || 'client@servicerapide.africa',
        customer_name: `${user?.firstName || 'Client'} ${user?.lastName || ''}`.trim() || 'Client SERVICE RAPIDE',
        customer_phone: momoPhone || '',
        metadata: {
          userId: user?.id,
          providerId: prov.id,
          action: 'CONTACT_UNLOCK',
        },
      });
      window.location.href = checkoutUrl;
      return;
    } catch (err: any) {
      alert("Erreur SasPay : " + (err.message || 'Impossible de joindre le service de paiement'));
      return;
    }
  };

  // Demande remboursement
  const handleRequestRefund = async () => {
    if (!refundModalItem || !refundModalItem.unlockId) return;

    setInternalProviders((prev) =>
      prev.map((p) => (p.id === refundModalItem.id ? { ...p, refundStatus: 'PENDING' } : p))
    );

    setRefundModalItem(null);
    setRefundReason('');
    setActionMsg('Votre réclamation a été transmise à notre service client pour vérification.');
    setTimeout(() => setActionMsg(null), 5000);
  };

  // Filtrage et Recherche intelligente
  const filtered = currentProviders
    .filter((p) => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.serviceOffered.toLowerCase().includes(query) ||
        p.singleName.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.department.toLowerCase().includes(query) ||
        (p.skills && p.skills.some((s) => s.toLowerCase().includes(query))) ||
        (p.interventionZones && p.interventionZones.some((z) => z.toLowerCase().includes(query)));

      const matchCity = selectedCity ? p.city.toLowerCase().includes(selectedCity.toLowerCase()) : true;
      const matchAvailableNow = filterAvailableNowOnly ? p.availability === 'AVAILABLE' : true;

      return matchSearch && matchCity && matchAvailableNow;
    })
    .sort((a, b) => {
      const priceA = (a.basePrice || 0) + (a.travelRequired ? a.travelFee || 0 : 0);
      const priceB = (b.basePrice || 0) + (b.travelRequired ? b.travelFee || 0 : 0);

      if (sortBy === 'PRICE_ASC') return priceA - priceB;
      if (sortBy === 'RATING_DESC') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'MISSIONS_DESC') return (b.completedMissions || 0) - (a.completedMissions || 0);
      return 0;
    });

  const availableNowCount = currentProviders.filter((p) => p.availability === 'AVAILABLE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* BANNIÈRE MODÈLE CLIENT : SANS ABONNEMENT - 1 000 FCFA PAR CONTACT */}
      <div className="rounded-3xl p-4 sm:p-5 border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs bg-gradient-to-r from-brand-500/10 via-brand-50 to-white border-brand-200">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-brand-600 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Formule Client • Sans abonnement
              </span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                Paiement à l'acte
              </span>
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
              1 000 FCFA par contact débloqué • Accès immédiat au numéro direct et WhatsApp du prestataire
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs transition w-full sm:w-auto"
          >
            <CreditCard className="w-4 h-4 text-brand-600" />
            <span>Mes contacts ({unlockedProviderIds.length})</span>
          </button>
        </div>
      </div>

          {actionMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMsg}</span>
            </div>
          )}

      {/* ONGLET 1 : RECHERCHE NATURELLE & LISTE DES PRESTATAIRES */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-5">
          {/* BANNIÈRE DE RECHERCHE NATURELLE : « Je cherche tel service maintenant près de moi. » */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Recherche Instantanée Panafricaine</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black">
                « Je cherche tel service maintenant près de moi. »
              </h2>
              <p className="text-xs text-white/85">
                Exprimez simplement votre besoin pour trouver un artisan qualifié disponible immédiatement ou programmer un rendez-vous.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Ex: Je cherche un réparateur de climatiseur maintenant près de Cocody..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-semibold shadow-md focus:ring-4 focus:ring-amber-400/50 outline-none"
              />
            </div>

            {/* Suggestions en un clic */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-bold text-white/75 mr-1">Exemples rapides :</span>
              {[
                { label: '⚡ Climatisation maintenant', q: 'Climatisation' },
                { label: '⚡ Électricien d’urgence', q: 'Électricien' },
                { label: '⚡ Plombier fuite d’eau', q: 'Plombier' },
                { label: '📅 Coiffure à domicile', q: 'Coiffure' },
                { label: '🚗 Dépannage auto', q: 'Mécanique' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchTerm(item.q)}
                  className="text-[11px] font-bold bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-2.5 py-1 transition"
                >
                  {item.label}
                </button>
              ))}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[11px] font-bold bg-black/20 hover:bg-black/30 text-white rounded-xl px-2.5 py-1 transition ml-auto"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* BARRE DE FILTRES & COMPARATEUR DE PRIX */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Filtre Ville / Quartier */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filtrer par ville ou quartier..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Bouton Disponible Maintenant */}
              <button
                type="button"
                onClick={() => setFilterAvailableNowOnly(!filterAvailableNowOnly)}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  filterAvailableNowOnly
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Disponibles MAINTENANT ({availableNowCount})</span>
              </button>

              {/* Comparateur & Tri */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DEFAULT">Pertinence</option>
                  <option value="PRICE_ASC">Prix le plus bas (Comparer)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
              <span>{filtered.length} prestataire(s) trouvé(s)</span>
            </div>
          </div>

          {/* GRILLE DES PRESTATAIRES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-black text-slate-800">Aucun prestataire disponible pour le moment</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Dès que des prestataires qualifiés s'inscriront dans votre ville ou pays, ils apparaîtront ici.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
              const isBusy = item.availability === 'BUSY';
              const isUnlocked = Boolean(
                item.isContactUnlocked || unlockedProviderIds.includes(item.id)
              );
              const estimatedPrice = (item.basePrice || 5000) + (item.travelRequired ? item.travelFee || 0 : 0);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                    isBusy
                      ? 'border-slate-200 bg-slate-50/70 opacity-90'
                      : 'border-slate-200 hover:border-brand-500/50 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* EN-TÊTE : Photo + Un seul nom + Disponibilité en direct */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative shrink-0 cursor-pointer group"
                          onClick={() => setSelectedDetailProvider(item)}
                          title="Cliquez pour voir le profil complet et les photos"
                        >
                          <img
                            src={
                              item.photoUrl ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.singleName}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs group-hover:ring-brand-500 transition"
                          />
                        </div>

                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedDetailProvider(item)}
                          title="Cliquez pour voir le profil complet et les photos"
                        >
                          <div className="flex items-center gap-2">
                            {/* RÈGLE STRICTE : Un seul nom visible avant déblocage */}
                            <h4 className="text-sm font-black text-slate-900 hover:text-brand-600 transition">
                              {isUnlocked && item.contact.fullName ? item.contact.fullName : item.singleName}
                            </h4>
                          </div>
                          <p className="text-xs font-bold text-brand-600 mt-0.5">{item.serviceOffered}</p>
                        </div>
                      </div>

                      {/* DISPONIBILITÉ MAINTENANT OU OCCUPÉ */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${
                          isBusy
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/20'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBusy ? 'bg-rose-600' : 'bg-emerald-600 animate-pulse'
                          }`}
                        />
                        <span>{isBusy ? 'Occupé' : 'Disponible MAINTENANT'}</span>
                      </span>
                    </div>

                    {/* ZONE GÉOGRAPHIQUE & ZONES D'INTERVENTION COUVERTES */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {item.city}, {item.department}
                        </span>
                      </div>
                      {item.interventionZones && item.interventionZones.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pl-5 text-[10px] text-slate-500 font-medium">
                          <span>Zones :</span>
                          {item.interventionZones.map((z) => (
                            <span key={z} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {z}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* COMPÉTENCES / SERVICES DÉTAILLÉS */}
                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-semibold bg-brand-50 text-brand-800 px-2 py-0.5 rounded-lg border border-brand-200/50"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* PRIX ESTIMÉ DU SERVICE & DÉCOMPOSITION TRANSPARENTE */}
                    <div className="mb-3.5 p-3 bg-emerald-50 rounded-2xl border border-emerald-200/90 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          Prix Total Estimé
                        </span>
                        <p className="text-sm font-black text-emerald-950 leading-tight">
                          {estimatedPrice.toLocaleString()} FCFA
                          <span className="text-[11px] font-semibold text-emerald-700 ml-1">
                            / {item.pricingUnit || 'prestation'}
                          </span>
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">
                          Base : {(item.basePrice || 5000).toLocaleString()} FCFA
                          {item.travelRequired && ` + Déplacement : ${item.travelFee.toLocaleString()} FCFA`}
                        </p>
                      </div>
                    </div>

                    {/* Modalités d'intervention */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600 mb-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>Sur place : {item.receivesOnSite ? 'Oui' : 'Non'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Truck className="w-3 h-3 text-slate-500" />
                        <span>
                          Déplacement : {item.travelRequired ? `Oui (${item.travelFee} FCFA)` : 'Non'}
                        </span>
                      </span>
                    </div>

                    {/* BOUTON VOIR LE PROFIL & PHOTOS */}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailProvider(item)}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition mb-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-600" />
                      <span>Consulter le profil & photos ({item.portfolioPhotos?.length || 0})</span>
                    </button>
                  </div>

                  {/* ZONE CONTACT (DÉBLOQUÉ / BLOQUÉ) - BOUTONS UNIFORMISÉS ET ALIGNÉS */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* Zone de Contact Débloqué / Bloqué */}
                    {isUnlocked ? (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Contact Débloqué
                          </span>
                          {item.refundStatus === 'PENDING' ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Remboursement en attente
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRefundModalItem(item)}
                              className="text-[10px] font-bold text-slate-500 hover:text-rose-600 underline"
                            >
                              Signaler un litige
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{item.contact.directPhone}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <a
                              href={`tel:${item.contact.directPhone}`}
                              className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
                            >
                              <Phone className="w-3.5 h-3.5 mr-1" />
                              <span>Appeler</span>
                            </a>
                            {item.contact.whatsappNumber && (
                              <a
                                href={`https://wa.me/${item.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                <span>WhatsApp Direct</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {isBusy ? (
                          <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                            <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>Prestataire Occupé : Prise de contact suspendue</span>
                            </div>
                            <span className="text-[10px] bg-rose-200 text-rose-900 font-extrabold px-2 py-0.5 rounded-md">
                              Occupé
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-brand-600" />
                              <span>Coordonnées masquées • Déblocage unitaire à 1 000 FCFA</span>
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => setUnlockModalProvider(item)}
                                className="inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-black transition flex-1 sm:flex-initial shadow-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Débloquer ce contact (1 000 FCFA)</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      )}

      {/* ONGLET 2 : SUIVI DES DEMANDES & RÉSERVATIONS DU CLIENT */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Mes Demandes & Réservations</h3>
              <p className="text-xs text-slate-500">
                Suivez en temps réel la prise en charge de vos missions par les prestataires
              </p>
            </div>
            <button
              onClick={() => setActiveTab('PROVIDERS')}
              className="text-xs font-bold bg-brand-600 text-white px-3 py-1.5 rounded-xl hover:bg-brand-700 transition"
            >
              + Nouvelle demande
            </button>
          </div>

          {clientRequests.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Vous n'avez pas encore envoyé de demande de service.</p>
              <button
                onClick={() => setActiveTab('PROVIDERS')}
                className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Chercher un prestataire
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clientRequests.map((req) => {
                const isImmediate = req.mode === 'IMMEDIATE';
                const providerTarget = currentProviders.find((p) => p.id === req.providerId);

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            isImmediate
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}
                        >
                          {isImmediate ? (
                            <>
                              <Zap className="w-3 h-3 text-amber-600" />
                              <span>MAINTENANT (Immédiat)</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>PROGRAMMÉ</span>
                            </>
                          )}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            req.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : req.status === 'COMPLETED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {req.status === 'ACCEPTED' && '✓ Acceptée par le prestataire'}
                          {req.status === 'REJECTED' && '✕ Refusée'}
                          {req.status === 'COMPLETED' && '🏁 Terminée avec succès'}
                          {req.status === 'PENDING' && '⏳ En attente de confirmation'}
                        </span>

                        <span className="text-[10px] text-slate-400">{req.createdAt}</span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900">
                        {req.serviceTitle} • Prestataire : {req.providerSingleName}
                      </h4>
                      <p className="text-xs text-slate-600">{req.description}</p>
                      <p className="text-[11px] text-slate-500">
                        📍 {req.location} • 📅 {req.scheduledDateTime}
                      </p>
                      <p className="text-xs font-black text-emerald-700">
                        Montant estimé : {req.estimatedPrice.toLocaleString()} FCFA ({req.paymentMethod})
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowSupportModal(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition"
                      >
                        Signaler un litige
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3 : FIL D'ACTUALITÉ */}
      {activeTab === 'FEED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Réalisations, Conseils & Publicités Panafricaines
            </h3>
            <span className="text-[10px] text-slate-400">Fil d'actualité en direct</span>
          </div>
          <FeedPosts
            userRole="CLIENT"
            currentUser={user}
            posts={posts}
            onAddPost={onAddPost}
            onOpenAds={() => setActiveTab('ADS')}
          />
        </div>
      )}

      {/* ONGLET 4 : PUBLICITÉS PANAFRICAINES */}
      {activeTab === 'ADS' && (
        <div className="space-y-4">
          <AdsSection currentUser={user} />
        </div>
      )}

      {/* Modal Support 24/7 */}
      {showSupportModal && <SupportModal onClose={() => setShowSupportModal(false)} />}

      {/* Modal Profil Client */}
      {showProfileModal && (
        <ClientProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={onUpdateUser} />
      )}

      {/* Modal Déblocage Contact */}
      {unlockModalProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto">
            <h4 className="text-base font-black text-slate-900 mb-1">Mise en Contact Sécurisée</h4>
            <p className="text-xs text-slate-500 mb-4">
              Prestataire : <strong>{unlockModalProvider.singleName}</strong> ({unlockModalProvider.serviceOffered})
            </p>

            <div className="space-y-3 mb-4">
              <div className="p-3 bg-brand-50 rounded-2xl border border-brand-200 text-brand-900 text-xs">
                <p className="font-bold">📱 Déblocage du contact prestataire</p>
                <p className="text-[11px] text-brand-800 mt-0.5">
                  Accédez instantanément au numéro d'appel direct et au WhatsApp du professionnel en validant le paiement unitaire.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-bold p-2.5 bg-slate-50 rounded-xl">
                <span>Frais de mise en relation :</span>
                <span className="text-brand-600 font-black">1 000 FCFA</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Numéro Mobile Money (Optionnel pour préremplissage)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: 0700000000"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnlockModalProvider(null)}
                className="inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition flex-1"
              >
                Payer 1 000 FCFA (SasPay)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remboursement */}
      {refundModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto">
            <h4 className="text-base font-black text-slate-900 mb-1">Demande de Remboursement</h4>
            <p className="text-xs text-slate-500 mb-3">
              Chaque réclamation est vérifiée avec bienveillance par l'équipe support.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif de votre réclamation</label>
              <textarea
                rows={3}
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex: Le numéro ne répond pas, le prestataire refuse d'intervenir..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRefundModalItem(null)}
                className="inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex-1"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleRequestRefund}
                disabled={!refundReason.trim()}
                className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-xs transition flex-1"
              >
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails & Photos Prestataire (Consultable par le client, coordonnées masquées avant paiement) */}
      {selectedDetailProvider && (
        <ProviderDetailModal
          provider={selectedDetailProvider}
          isUnlocked={Boolean(
            selectedDetailProvider.isContactUnlocked ||
            unlockedProviderIds.includes(selectedDetailProvider.id)
          )}
          onClose={() => setSelectedDetailProvider(null)}
          onUnlock={(p) => {
            setSelectedDetailProvider(null);
            setUnlockModalProvider(p);
          }}
          onReportIssue={(p) => {
            setSelectedDetailProvider(null);
            setRefundModalItem(p);
          }}
        />
      )}
    </div>
  );
};
