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
      {/* BANNIÈRE */}
      <div className="sr-card space-y-4">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #4036ae, #2b2670)' }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="sr-badge">Formule client · Paiement à l'acte</span>
            <h2 className="sr-title text-xl">1 000 FCFA par contact débloqué</h2>
            <p className="sr-text text-sm">
              Accès immédiat au numéro direct et WhatsApp du prestataire.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="sr-btn-outline w-full"
        >
          <CreditCard className="w-4 h-4" />
          <span>Mes contacts ({unlockedProviderIds.length})</span>
        </button>
      </div>

      {actionMsg && (
        <div
          className="sr-mint-box flex items-center gap-3 text-sm font-semibold"
          style={{ color: 'var(--sr-title)' }}
        >
          <span className="sr-check">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ONGLET 1 : RECHERCHE & LISTE DES PRESTATAIRES */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-5">
          {/* RECHERCHE & FILTRES */}
          <div className="sr-card space-y-3">
            <div className="relative">
              <Search
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--sr-text)' }}
              />
              <input
                type="text"
                placeholder="Rechercher un service, un prestataire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sr-input"
                style={{ paddingLeft: '46px' }}
              />
            </div>

            <input
              type="text"
              placeholder="Filtrer par ville ou quartier..."
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="sr-input"
            />

            <button
              type="button"
              onClick={() => setFilterAvailableNowOnly(!filterAvailableNowOnly)}
              className={filterAvailableNowOnly ? 'sr-btn w-full' : 'sr-btn-outline w-full'}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6bc4a0' }} />
              <span>Disponibles maintenant ({availableNowCount})</span>
            </button>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 shrink-0" style={{ color: 'var(--sr-text)' }} />
              <span className="text-sm font-semibold">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="sr-input"
                style={{ width: 'auto', padding: '10px 14px' }}
              >
                <option value="DEFAULT">Pertinence</option>
                <option value="PRICE_ASC">Prix le plus bas</option>
              </select>
            </div>

            <p
              className="text-sm sr-text pt-3"
              style={{ borderTop: '1px solid var(--sr-border)' }}
            >
              {filtered.length} prestataire(s) trouvé(s)
            </p>
          </div>

          {/* GRILLE DES PRESTATAIRES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full sr-card text-center py-10">
                <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--sr-check)' }} />
                <h4 className="sr-title text-lg">Aucun prestataire disponible</h4>
                <p className="sr-text text-sm mt-2 max-w-sm mx-auto">
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
                  className={`sr-card flex flex-col justify-between ${isBusy ? 'opacity-70' : ''}`}
                >
                  <div>
                    {/* EN-TÊTE : Photo + Un seul nom + Disponibilité */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative shrink-0 cursor-pointer"
                          onClick={() => setSelectedDetailProvider(item)}
                          title="Voir le profil complet"
                        >
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.singleName}
                              className="w-16 h-16 rounded-2xl object-cover"
                              style={{ border: '1px solid var(--sr-border)' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl"
                              style={{
                                background: 'var(--sr-mint)',
                                color: 'var(--sr-primary-dark)',
                                border: '1px solid var(--sr-border)',
                              }}
                            >
                              {item.singleName?.charAt(0).toUpperCase() || 'P'}
                            </div>
                          )}
                        </div>

                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedDetailProvider(item)}
                          title="Voir le profil complet"
                        >
                          <div className="flex items-center gap-2">
                            {/* RÈGLE STRICTE : Un seul nom visible avant déblocage */}
                            <h4 className="sr-title text-lg">
                              {isUnlocked && item.contact.fullName ? item.contact.fullName : item.singleName}
                            </h4>
                          </div>
                          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--sr-primary)' }}>
                            {item.serviceOffered}
                          </p>
                        </div>
                      </div>

                      {/* DISPONIBILITÉ */}
                      <span
                        className="text-[11px] font-bold px-3 py-2 rounded-full flex items-center gap-2 shrink-0"
                        style={
                          isBusy
                            ? { background: '#fde8ec', color: '#a1223b' }
                            : { background: 'var(--sr-mint)', color: '#1b6b4a' }
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: isBusy ? '#e11d48' : '#6bc4a0' }}
                        />
                        <span>{isBusy ? 'Occupé' : 'Disponible MAINTENANT'}</span>
                      </span>
                    </div>

                    {/* ZONE GÉOGRAPHIQUE */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--sr-title)' }}>
                        <MapPin className="w-4 h-4 shrink-0" style={{ color: 'var(--sr-text)' }} />
                        <span>
                          {item.city}, {item.department}
                        </span>
                      </div>
                      {item.interventionZones && item.interventionZones.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pl-6 text-xs sr-text">
                          <span>Zones :</span>
                          {item.interventionZones.map((z) => (
                            <span
                              key={z}
                              className="px-2 py-0.5 rounded-md"
                              style={{ background: '#f1f1f4', color: 'var(--sr-title)' }}
                            >
                              {z}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* COMPÉTENCES */}
                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ background: 'var(--sr-lavender)', color: 'var(--sr-primary-dark)' }}
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* PRIX ESTIMÉ */}
                    <div className="sr-mint-box mb-4">
                      <span
                        className="text-[11px] font-bold uppercase tracking-widest block"
                        style={{ color: '#1b6b4a' }}
                      >
                        Prix total estimé
                      </span>
                      <p className="sr-title text-2xl mt-1">
                        {estimatedPrice.toLocaleString()} FCFA
                        <span className="text-sm font-semibold ml-1" style={{ color: '#1b6b4a' }}>
                          / {item.pricingUnit || 'prestation'}
                        </span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#1b6b4a' }}>
                        Base : {(item.basePrice || 5000).toLocaleString()} FCFA
                        {item.travelRequired && ` + Déplacement : ${item.travelFee.toLocaleString()} FCFA`}
                      </p>
                    </div>

                    {/* Modalités d'intervention */}
                    <div className="flex flex-wrap gap-2 text-xs font-medium mb-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl"
                        style={{ background: '#f1f1f4', color: 'var(--sr-title)' }}
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>Sur place : {item.receivesOnSite ? 'Oui' : 'Non'}</span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl"
                        style={{ background: '#f1f1f4', color: 'var(--sr-title)' }}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>
                          Déplacement : {item.travelRequired ? `Oui (${item.travelFee} FCFA)` : 'Non'}
                        </span>
                      </span>
                    </div>

                    {/* BOUTON VOIR LE PROFIL */}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailProvider(item)}
                      className="sr-btn-outline w-full mb-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Consulter le profil & photos ({item.portfolioPhotos?.length || 0})</span>
                    </button>
                  </div>

                  {/* ZONE CONTACT (DÉBLOQUÉ / BLOQUÉ) */}
                  <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--sr-border)' }}>
                    {isUnlocked ? (
                      <div className="sr-mint-box">
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <span
                            className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: '#1b6b4a' }}
                          >
                            <Unlock className="w-3.5 h-3.5" /> Contact débloqué
                          </span>
                          {item.refundStatus === 'PENDING' ? (
                            <span
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: '#fef3c7', color: '#92400e' }}
                            >
                              Remboursement en attente
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRefundModalItem(item)}
                              className="text-[11px] font-semibold underline"
                              style={{ color: 'var(--sr-text)' }}
                            >
                              Signaler un litige
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div
                            className="text-base font-bold flex items-center gap-2"
                            style={{ color: 'var(--sr-title)' }}
                          >
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{item.contact.directPhone}</span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <a href={`tel:${item.contact.directPhone}`} className="sr-btn w-full">
                              <Phone className="w-4 h-4" />
                              <span>Appeler</span>
                            </a>
                            {item.contact.whatsappNumber && (
                              <a
                                href={`https://wa.me/${item.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="sr-btn w-full"
                                style={{ background: '#16a34a', boxShadow: '0 6px 16px rgba(22,163,74,0.25)' }}
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>WhatsApp direct</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {isBusy ? (
                          <div
                            className="flex items-center justify-between gap-2 p-3 rounded-2xl"
                            style={{ background: '#fde8ec' }}
                          >
                            <div
                              className="flex items-center gap-2 text-sm font-semibold"
                              style={{ color: '#a1223b' }}
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>Prestataire occupé : contact suspendu</span>
                            </div>
                            <span
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                              style={{ background: '#fbcfd8', color: '#a1223b' }}
                            >
                              Occupé
                            </span>
                          </div>
                        ) : (
                                                    <div className="space-y-3">
                            <p
                              className="text-sm font-semibold flex items-center gap-2"
                              style={{ color: 'var(--sr-text)' }}
                            >
                              <Lock className="w-4 h-4 shrink-0" style={{ color: 'var(--sr-primary)' }} />
                              <span>Coordonnées masquées · Déblocage unitaire à 1 000 FCFA</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setUnlockModalProvider(item)}
                              className="sr-btn w-full"
                            >
                              <Lock className="w-4 h-4" />
                              <span>Débloquer ce contact (1 000 FCFA)</span>
                            </button>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="sr-title text-xl">Mes demandes & réservations</h3>
              <p className="sr-text text-sm mt-1">
                Suivez en temps réel la prise en charge de vos missions par les prestataires
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('PROVIDERS')}
            className="sr-btn w-full"
          >
            <span>Nouvelle demande</span>
            <span>→</span>
          </button>

          {clientRequests.length === 0 ? (
            <div className="sr-card text-center space-y-4 py-10">
              <Clock className="w-10 h-10 mx-auto" style={{ color: 'var(--sr-check)' }} />
              <p className="sr-text text-sm">
                Vous n'avez pas encore envoyé de demande de service.
              </p>
              <button
                onClick={() => setActiveTab('PROVIDERS')}
                className="sr-btn"
              >
                <span>Chercher un prestataire</span>
                <span>→</span>
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
                    className="sr-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                          style={
                            isImmediate
                              ? { background: '#fef3c7', color: '#92400e' }
                              : { background: 'var(--sr-lavender)', color: 'var(--sr-primary-dark)' }
                          }
                        >
                          {isImmediate ? (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Maintenant (immédiat)</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Programmé</span>
                            </>
                          )}
                        </span>

                        <span
                          className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                          style={
                            req.status === 'ACCEPTED'
                              ? { background: 'var(--sr-mint)', color: '#1b6b4a' }
                              : req.status === 'REJECTED'
                              ? { background: '#fde8ec', color: '#a1223b' }
                              : req.status === 'COMPLETED'
                              ? { background: 'var(--sr-lavender)', color: 'var(--sr-primary-dark)' }
                              : { background: '#fef3c7', color: '#92400e' }
                          }
                        >
                          {req.status === 'ACCEPTED' && '✓ Acceptée par le prestataire'}
                          {req.status === 'REJECTED' && '✕ Refusée'}
                          {req.status === 'COMPLETED' && '🏁 Terminée avec succès'}
                          {req.status === 'PENDING' && '⏳ En attente de confirmation'}
                        </span>

                        <span className="text-xs sr-text">{req.createdAt}</span>
                      </div>

                      <h4 className="sr-title text-lg">
                        {req.serviceTitle} · Prestataire : {req.providerSingleName}
                      </h4>
                                        <p className="sr-text text-sm">{req.description}</p>
                      <p className="text-sm sr-text">
                        📍 {req.location} · 📅 {req.scheduledDateTime}
                      </p>
                      <p className="text-base font-bold" style={{ color: '#1b6b4a' }}>
                        Montant estimé : {req.estimatedPrice.toLocaleString()} FCFA ({req.paymentMethod})
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowSupportModal(true)}
                        className="sr-btn-outline w-full"
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
          <div className="space-y-2">
            <span className="sr-badge">Fil d'actualité en direct</span>
            <h3 className="sr-title text-xl">Réalisations, conseils & publicités panafricaines</h3>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15, 15, 20, 0.55)' }}
        >
          <div className="sr-card max-w-sm w-full my-auto space-y-4" style={{ padding: '24px' }}>
            <div className="space-y-2">
              <span className="sr-badge">Mise en contact sécurisée</span>
              <h4 className="sr-title text-xl">Débloquer le contact</h4>
              <p className="sr-text text-sm">
                Prestataire : <strong>{unlockModalProvider.singleName}</strong> ({unlockModalProvider.serviceOffered})
              </p>
            </div>

            <div className="sr-mint-box">
              <p className="font-bold text-sm" style={{ color: 'var(--sr-title)' }}>
                📱 Déblocage du contact prestataire
              </p>
              <p className="text-sm mt-1" style={{ color: '#1b6b4a' }}>
                Accédez instantanément au numéro d'appel direct et au WhatsApp du professionnel en validant le paiement unitaire.
              </p>
            </div>

            <div
              className="flex items-center justify-between text-sm font-semibold p-4 rounded-2xl"
              style={{ background: '#f1f1f4', color: 'var(--sr-title)' }}
            >
              <span>Frais de mise en relation</span>
              <span className="sr-title">1 000 FCFA</span>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--sr-title)' }}
              >
                Numéro Mobile Money (optionnel)
              </label>
              <input
                type="tel"
                placeholder="Ex: 0700000000"
                value={momoPhone}
                onChange={(e) => setMomoPhone(e.target.value)}
                className="sr-input"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button type="button" onClick={handleConfirmUnlock} className="sr-btn w-full">
                <span>Payer 1 000 FCFA (SasPay)</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => setUnlockModalProvider(null)}
                className="sr-btn-outline w-full"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remboursement */}
      {refundModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15, 15, 20, 0.55)' }}
        >
          <div className="sr-card max-w-sm w-full my-auto space-y-4" style={{ padding: '24px' }}>
            <div className="space-y-2">
              <span className="sr-badge">Réclamation</span>
              <h4 className="sr-title text-xl">Demande de remboursement</h4>
              <p className="sr-text text-sm">
                Chaque réclamation est vérifiée avec bienveillance par l'équipe support.
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--sr-title)' }}
              >
                Motif de votre réclamation
              </label>
              <textarea
                rows={3}
                required
                               value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex: Le numéro ne répond pas, le prestataire refuse d'intervenir..."
                className="sr-input"
                style={{ borderRadius: '16px' }}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleRequestRefund}
                disabled={!refundReason.trim()}
                className="sr-btn w-full disabled:opacity-50"
              >
                <span>Envoyer la demande</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => setRefundModalItem(null)}
                className="sr-btn-outline w-full"
              >
                Fermer
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
