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
} from 'lucide-react';
import { ProviderItem, PostItem, ServiceRequest } from '../types';
import { AdsSection } from './AdsSection';
import { FeedPosts } from './FeedPosts';
import { ClientProfileModal } from './ClientProfileModal';
import { SupportModal } from './SupportModal';
import { saspayClient } from '../config/saspay';

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
}) => {
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'REQUESTS' | 'FEED' | 'ADS'>('PROVIDERS');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Modales d'action
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

  const trialExpires = user.clientTrialExpiresAt ? new Date(user.clientTrialExpiresAt) : null;
  const isTrialActive = trialExpires && trialExpires > new Date();

  // Liste des prestataires enregistrés
  const defaultMockProviders: ProviderItem[] = [];

  const [internalProviders, setInternalProviders] = useState<ProviderItem[]>(defaultMockProviders);
  const currentProviders = externalProviders || internalProviders;

  const [internalRequests, setInternalRequests] = useState<ServiceRequest[]>([]);

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

  // Déblocage contact
  const handleConfirmUnlock = async () => {
    if (!unlockModalProvider) return;
    const prov = unlockModalProvider;

    if (prov.availability === 'BUSY') {
      alert('Impossible : Ce prestataire est actuellement OCCUPÉ.');
      return;
    }

    // Si la période d'essai n'est plus active, déclencher le paiement sécurisé SasPay
    if (!isTrialActive) {
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
        console.error('Erreur initialisation SasPay :', err);
      }
    }

    setInternalProviders((prev) =>
      prev.map((p) =>
        p.id === prov.id
          ? {
              ...p,
              isContactUnlocked: true,
              unlockId: `unlock-${Date.now()}`,
              contact: {
                directPhone: '+225 07 89 45 12 00',
                whatsappNumber: '+2250789451200',
                fullName: `${p.singleName} Kouamé`,
              },
            }
          : p
      )
    );

    setUnlockModalProvider(null);
    setActionMsg(
      isTrialActive
        ? '🎁 Contact débloqué GRATUITEMENT grâce à votre semaine offerte !'
        : '💳 Contact débloqué avec succès par Mobile Money (1 000 FCFA).'
    );
    setTimeout(() => setActionMsg(null), 4000);
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profil Client & Actions Rapides */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt="Profil Client"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-500/30"
            />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {user?.firstName || 'Client'} {user?.lastName || ''}
            </h3>
            <p className="text-xs text-slate-500">
              {isTrialActive ? (
                <span className="text-emerald-700 font-bold">
                  🎁 Semaine Gratuite Active jusqu'au {trialExpires?.toLocaleDateString()}
                </span>
              ) : (
                'Compte Client Actif • Paiement Mobile Money sécurisé'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-3 py-2 rounded-xl text-xs transition border border-brand-200/80"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support 24/7</span>
          </button>

          <button
            onClick={() => setActiveTab('ADS')}
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-2 rounded-xl text-xs transition border border-amber-200"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-600" />
            <span>Faire une publicité</span>
          </button>

          <button
            onClick={() => setShowProfileModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Mon Profil</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Barre d'onglets pour le Client */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'PROVIDERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-brand-600" />
          <span>Prestataires ({availableNowCount} Disponibles)</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'REQUESTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Mes Réservations ({clientRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FEED')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'FEED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Rss className="w-3.5 h-3.5 text-blue-600" />
          <span>Fil d'Actualité</span>
        </button>

        <button
          onClick={() => setActiveTab('ADS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'ADS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-500" />
          <span>Publicités & Offres</span>
        </button>
      </div>

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
              const isUnlocked = item.isContactUnlocked;
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
                        <div className="relative">
                          <img
                            src={
                              item.photoUrl ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.singleName}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            {/* RÈGLE STRICTE : Un seul nom visible avant déblocage */}
                            <h4 className="text-sm font-black text-slate-900">
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
                  </div>

                  {/* ZONE CONTACT (DÉBLOQUÉ / BLOQUÉ) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* Zone de Contact Débloqué / Bloqué */}
                    {isUnlocked ? (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Contact Débloqué
                          </span>
                          {item.refundStatus === 'PENDING' ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Remboursement en attente
                            </span>
                          ) : (
                            <button
                              onClick={() => setRefundModalItem(item)}
                              className="text-[10px] font-bold text-slate-500 hover:text-rose-600 underline"
                            >
                              Signaler un problème
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              {item.contact.directPhone}
                            </span>
                            <a
                              href={`tel:${item.contact.directPhone}`}
                              className="text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100"
                            >
                              Appeler
                            </a>
                          </div>

                          {item.contact.whatsappNumber && (
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                {item.contact.whatsappNumber}
                              </span>
                              <a
                                href={`https://wa.me/${item.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                              >
                                WhatsApp Direct
                              </a>
                            </div>
                          )}
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
                          <button
                            onClick={() => setUnlockModalProvider(item)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isTrialActive
                                ? 'Débloquer le contact (Gratuit - Semaine d’essai)'
                                : 'Débloquer le contact direct (1 000 FCFA Mobile Money)'}
                            </span>
                          </button>
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
              Réalisations & Conseils des Prestataires
            </h3>
            <span className="text-[10px] text-slate-400">Fil d'actualité en direct</span>
          </div>
          <FeedPosts userRole="CLIENT" currentUser={user} posts={posts} onAddPost={onAddPost} />
        </div>
      )}

      {/* ONGLET 4 : PUBLICITÉS PANAFRICAINES */}
      {activeTab === 'ADS' && (
        <div className="space-y-4">
          <AdsSection />
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-black text-slate-900 mb-1">Mise en Contact Sécurisée</h4>
            <p className="text-xs text-slate-500 mb-4">
              Prestataire : <strong>{unlockModalProvider.singleName}</strong> ({unlockModalProvider.serviceOffered})
            </p>

            {isTrialActive ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ce déblocage est 100% GRATUIT grâce à votre semaine offerte !</span>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <p className="text-xs font-bold text-slate-800">
                  Montant à régler : <span className="text-brand-600">1 000 FCFA</span>
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Moyen de Paiement Mobile Money
                  </label>
                  <select
                    value={momoOperator}
                    onChange={(e) => setMomoOperator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MOOV_MONEY">Moov Money</option>
                    <option value="WAVE">Wave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    placeholder="Ex: 0700000000"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setUnlockModalProvider(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
              >
                {isTrialActive ? 'Débloquer Gratuitement' : 'Payer 1 000 FCFA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remboursement */}
      {refundModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-black text-slate-900 mb-1">Demande de Remboursement</h4>
            <p className="text-xs text-slate-500 mb-3">
              Chaque demande est soumise à validation manuelle par l'administrateur.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif de votre réclamation</label>
              <textarea
                rows={3}
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex: Le numéro ne répond pas, le prestataire refuse d'intervenir, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRefundModalItem(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Fermer
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={!refundReason.trim()}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
              >
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
