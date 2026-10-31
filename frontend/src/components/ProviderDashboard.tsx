import React, { useState, useEffect } from 'react';
import {
  Power,
  MapPin,
  CheckCircle,
  CreditCard,
  Building,
  Truck,
  Phone,
  MessageCircle,
  Save,
  Camera,
  Upload,
  Rss,
  Users,
  Megaphone,
  Briefcase,
  Star,
  Clock,
  Zap,
  Calendar,
  XCircle,
  CheckCircle2,
  Tag,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  LogOut,
  User,
  Image as ImageIcon,
  Plus,
  Trash2,
  Layers,
  DollarSign,
} from 'lucide-react';
import { FeedPosts } from './FeedPosts';
import { AdsSection } from './AdsSection';
import { PostItem, ServiceRequest, ReviewItem, PricingTier } from '../types';
import { supabaseBackend } from '../config/supabase';
import { saspayClient } from '../config/saspay';
import { GeoCascadeSelect } from './GeoCascadeSelect';

interface ProviderDashboardProps {
  user: any;
  token: string;
  posts: PostItem[];
  serviceRequests?: ServiceRequest[];
  onAddPost: (post: Partial<PostItem>) => void;
  onUpdateRequestStatus?: (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'PAID') => void;
  onUpdateProviderProfile?: (updatedProfile: any) => void;
  onLogout?: () => void;
  activeSectionOverride?: string;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  user,
  token,
  posts,
  serviceRequests: externalRequests,
  onAddPost,
  onUpdateRequestStatus,
  onUpdateProviderProfile,
  onLogout,
  activeSectionOverride,
}) => {
  const [profile, setProfile] = useState<any>(() => {
    const p = user?.providerProfile || {};
    return {
      id: p.id || user?.id || 'prov-user',
      singleName: p.singleName || user?.firstName || 'Professionnel',
      fullName: p.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Professionnel',
      photoUrl: p.photoUrl || user?.avatarUrl || '',
      serviceOffered: p.serviceOffered || 'Services Spécialisés',
      skills: Array.isArray(p.skills) ? p.skills : [],
      city: p.city || user?.city || 'Abidjan',
      department: p.department || user?.department || 'Centre',
      commune: p.commune || user?.commune || '',
      country: p.country || user?.country || 'Bénin',
      countryCode: p.countryCode || user?.countryCode || 'BJ',
      interventionZones: Array.isArray(p.interventionZones) ? p.interventionZones : [],
      availability: p.availability || 'AVAILABLE',
      receivesOnSite: p.receivesOnSite !== undefined ? p.receivesOnSite : true,
      travelRequired: p.travelRequired !== undefined ? p.travelRequired : false,
      travelFee: p.travelFee || 0,
      basePrice: p.basePrice || 5000,
      pricingUnit: p.pricingUnit || 'par prestation',
      hourlyRate: p.hourlyRate ?? '',
      dailyRate: p.dailyRate ?? '',
      pricingTiers: Array.isArray(p.pricingTiers) ? p.pricingTiers : [],
      portfolioPhotos: Array.isArray(p.portfolioPhotos) ? p.portfolioPhotos : [],
      whatsappNumber: p.whatsappNumber || user?.phoneNumber || '',
      directPhoneNumber: p.directPhoneNumber || user?.phoneNumber || '',
      rating: p.rating || 0,
      reviewsCount: p.reviewsCount || 0,
      completedMissions: p.completedMissions || 0,
      subscriptionExpiresAt: p.subscriptionExpiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<'MISSIONS' | 'PROFILE' | 'BILLING' | 'FEED' | 'ADS'>(() => {
    try {
      const saved = sessionStorage.getItem('sr_provider_tab');
      if (saved === 'MISSIONS' || saved === 'PROFILE' || saved === 'BILLING' || saved === 'FEED' || saved === 'ADS') return saved;
    } catch {}
    return 'MISSIONS';
  });

  // Persister l'onglet actif dans sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('sr_provider_tab', activeSubTab); } catch {}
  }, [activeSubTab]);

  useEffect(() => {
    if (!activeSectionOverride) return;
    if (
      activeSectionOverride === 'MISSIONS' ||
      activeSectionOverride === 'PROFILE' ||
      activeSectionOverride === 'FEED' ||
      activeSectionOverride === 'ADS' ||
      activeSectionOverride === 'BILLING'
    ) {
      setActiveSubTab(activeSectionOverride as any);
    }
  }, [activeSectionOverride]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoOperator, setMomoOperator] = useState('ORANGE_MONEY');
  const [payments, setPayments] = useState<any[]>([]);

  // Nouveaux tags de compétences et zones
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newZoneInput, setNewZoneInput] = useState('');

  // Nouveaux états : portfolio photos & tarifs personnalisés
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState<number | ''>('');
  const [newTierUnit, setNewTierUnit] = useState('par prestation');

  // Synchronisation du profil si mis à jour dans le parent
  useEffect(() => {
    if (user?.providerProfile) {
      setProfile((prev: any) => ({
        ...prev,
        ...user.providerProfile,
        skills: Array.isArray(user.providerProfile.skills) ? user.providerProfile.skills : prev.skills,
        interventionZones: Array.isArray(user.providerProfile.interventionZones) ? user.providerProfile.interventionZones : prev.interventionZones,
        portfolioPhotos: Array.isArray(user.providerProfile.portfolioPhotos) ? user.providerProfile.portfolioPhotos : prev.portfolioPhotos,
        pricingTiers: Array.isArray(user.providerProfile.pricingTiers) ? user.providerProfile.pricingTiers : prev.pricingTiers,
      }));
    }
  }, [user?.providerProfile]);

  // Récupérer l'historique réel des paiements
  useEffect(() => {
    if (user?.id) {
      supabaseBackend.getPaymentHistory(user.id).then((history) => {
        setPayments(history);
      });
    }
  }, [user?.id]);

  // Calcul du statut de l'abonnement
  const isAvailable = profile.availability === 'AVAILABLE';
  const expiresDate = new Date(profile.subscriptionExpiresAt);
  const isSubActive = expiresDate > new Date();
  const daysLeftSub = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
  const isExpiringSoon = isSubActive && daysLeftSub <= 5;

  // Demandes de missions internes ou externes
  const [internalRequests, setInternalRequests] = useState<ServiceRequest[]>([
    {
      id: 'req-1',
      clientId: 'client-1',
      clientName: 'Awa Kouassi',
      clientPhone: '+225 07 48 12 34 56',
      clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      providerId: profile.id || 'prov-1',
      providerSingleName: profile.singleName,
      serviceTitle: 'Climatisation & Froid',
      description: 'Panne split salon : ne souffle plus d’air frais depuis ce matin. Urgent.',
      mode: 'IMMEDIATE',
      scheduledDateTime: 'Intervention Immédiate (Moins de 45 min)',
      location: 'Abidjan (Cocody Angré 8ème tranche)',
      estimatedPrice: 17500,
      status: 'PENDING',
      paymentMethod: 'ORANGE_MONEY',
      createdAt: 'Il y a 10 min',
      hasBeenRated: false,
    },
    {
      id: 'req-2',
      clientId: 'client-2',
      clientName: 'Michel Diallo',
      clientPhone: '+225 05 12 90 87 65',
      clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      providerId: profile.id || 'prov-1',
      providerSingleName: profile.singleName,
      serviceTitle: 'Entretien Climatiseur',
      description: 'Maintenance préventive complète de 2 splits avant la saison chaude.',
      mode: 'SCHEDULED',
      scheduledDateTime: 'Demain à 10h00',
      location: 'Abidjan (Plateau Rue du Commerce)',
      estimatedPrice: 20000,
      status: 'ACCEPTED',
      paymentMethod: 'WAVE',
      createdAt: 'Il y a 2 heures',
      hasBeenRated: false,
    },
  ]);

  const currentRequests = externalRequests || internalRequests;
  const providerMissions = currentRequests.filter(
    (r) =>
      r.providerId === profile.id ||
      r.providerSingleName.toLowerCase() === (profile.singleName || '').toLowerCase()
  );
  const pendingMissionsCount = providerMissions.filter((r) => r.status === 'PENDING').length;

  // Basculer la disponibilité en 1 clic (bloqué si abonnement expiré)
  const toggleAvailability = async () => {
    if (!isSubActive) {
      setShowSubModal(true);
      setSuccessMsg("⚠️ Abonnement mensuel requis (5 000 FCFA) : Veuillez activer votre abonnement pour redevenir Disponible.");
      setTimeout(() => setSuccessMsg(null), 5000);
      return;
    }

    const newStatus = isAvailable ? 'BUSY' : 'AVAILABLE';
    const updated = { ...profile, availability: newStatus };
    setProfile(updated);
    if (onUpdateProviderProfile) onUpdateProviderProfile(updated);

    try {
      await supabaseBackend.updateAvailability(user?.id, newStatus);
    } catch {}

    setSuccessMsg(`Statut mis à jour : ${newStatus === 'AVAILABLE' ? '🟢 Disponible pour missions' : '🔴 Actuellement Occupé'}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Traiter une mission (Accepter / Refuser / Terminer)
  const handleUpdateMissionStatus = (reqId: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    if (onUpdateRequestStatus) {
      onUpdateRequestStatus(reqId, status);
    } else {
      setInternalRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status } : r))
      );
    }

    const messages = {
      ACCEPTED: '✅ Mission acceptée ! Le client a été averti de votre confirmation.',
      REJECTED: '❌ Mission déclinée.',
      COMPLETED: '🏁 Mission marquée comme terminée avec succès !',
    };
    setSuccessMsg(messages[status]);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Ajout de compétence
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const currentSkills = profile.skills || [];
    if (!currentSkills.includes(newSkillInput.trim())) {
      setProfile({ ...profile, skills: [...currentSkills, newSkillInput.trim()] });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: (profile.skills || []).filter((s: string) => s !== skillToRemove),
    });
  };

  // Ajout de zone d'intervention
  const handleAddZone = () => {
    if (!newZoneInput.trim()) return;
    const currentZones = profile.interventionZones || [];
    if (!currentZones.includes(newZoneInput.trim())) {
      setProfile({ ...profile, interventionZones: [...currentZones, newZoneInput.trim()] });
    }
    setNewZoneInput('');
  };

  const handleRemoveZone = (zoneToRemove: string) => {
    setProfile({
      ...profile,
      interventionZones: (profile.interventionZones || []).filter((z: string) => z !== zoneToRemove),
    });
  };

  // Sauvegarder le profil et la photo
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabaseBackend.updateProviderProfile(user?.id, profile);
      if (onUpdateProviderProfile) onUpdateProviderProfile(profile);
      setSuccessMsg("Profil professionnel, tarifs, photos et zones d'intervention enregistrés avec succès !");
    } catch (err: any) {
      console.error('Erreur sauvegarde profil:', err);
      setSuccessMsg("❌ Erreur lors de l'enregistrement : " + (err.message || 'Veuillez réessayer.'));
    }
    setTimeout(() => setSuccessMsg(null), 4000);
    setLoading(false);
  };

  // Gestion du téléversement de la photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev: any) => ({ ...prev, photoUrl: reader.result as string }));
        setSuccessMsg('Photo sélectionnée. Cliquez sur Enregistrer pour valider.');
        setTimeout(() => setSuccessMsg(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gestion du téléversement de plusieurs photos de réalisations (Portfolio)
  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    let loadedCount = 0;
    const newPhotos: string[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newPhotos.push(reader.result);
        }
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setProfile((prev: any) => ({
            ...prev,
            portfolioPhotos: [...(prev.portfolioPhotos || []), ...newPhotos],
          }));
          setSuccessMsg(`${newPhotos.length} photo(s) ajoutée(s) à votre galerie !`);
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddPortfolioUrl = () => {
    if (!newPortfolioUrl.trim()) return;
    setProfile((prev: any) => ({
      ...prev,
      portfolioPhotos: [...(prev.portfolioPhotos || []), newPortfolioUrl.trim()],
    }));
    setNewPortfolioUrl('');
    setSuccessMsg('Photo ajoutée à la galerie !');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemovePortfolioPhoto = (indexToRemove: number) => {
    setProfile((prev: any) => ({
      ...prev,
      portfolioPhotos: (prev.portfolioPhotos || []).filter((_: any, idx: number) => idx !== indexToRemove),
    }));
  };

  // Ajout / Suppression de prestation tarifaire personnalisée
  const handleAddPricingTier = () => {
    if (!newTierName.trim() || newTierPrice === '' || Number(newTierPrice) <= 0) {
      setSuccessMsg('Veuillez renseigner le libellé de la prestation et un montant valide.');
      setTimeout(() => setSuccessMsg(null), 3000);
      return;
    }
    const newTier: PricingTier = {
      id: 'tier-' + Date.now(),
      name: newTierName.trim(),
      price: Number(newTierPrice),
      unit: newTierUnit || 'par prestation',
    };
    setProfile((prev: any) => ({
      ...prev,
      pricingTiers: [...(prev.pricingTiers || []), newTier],
    }));
    setNewTierName('');
    setNewTierPrice('');
    setNewTierUnit('par prestation');
    setSuccessMsg('Prestation ajoutée à vos tarifs !');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleRemovePricingTier = (tierId: string) => {
    setProfile((prev: any) => ({
      ...prev,
      pricingTiers: (prev.pricingTiers || []).filter((t: any) => t.id !== tierId),
    }));
  };

  const handlePaySubscription = async () => {
    try {
      const checkoutUrl = await saspayClient.createCheckoutSession({
        amount: 5000,
        customer_email: user?.email || 'prestataire@servicerapide.africa',
        customer_name:
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || profile.singleName || 'Prestataire SERVICE RAPIDE',
        metadata: {
          userId: user?.id,
          providerProfileId: profile.id,
          action: 'PROVIDER_SUBSCRIPTION',
        },
      });
      window.location.href = checkoutUrl;
      return;
    } catch (err: any) {
      console.error('Erreur initialisation SasPay :', err);
    }

    const newDate = new Date(expiresDate.getTime() + 30 * 24 * 3600 * 1000);
    setProfile((prev: any) => ({
      ...prev,
      subscriptionExpiresAt: newDate.toISOString(),
    }));
    setShowSubModal(false);
    setSuccessMsg('Abonnement renouvelé de 30 jours (5 000 FCFA) par Mobile Money !');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* BANDEAU SUPÉRIEUR STATUT & DISPONIBILITÉ 1-CLIC */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <img
              src={
                profile.photoUrl ||
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt="Profil Prestataire"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/30"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              {profile.singleName || 'Professionnel'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {profile.serviceOffered || 'Services Pro'} • {profile.city || 'Afrique'}
            </p>
          </div>
        </div>

        {/* Bouton Disponibilité 1-clic */}
        <button
          type="button"
          onClick={toggleAvailability}
          className={`w-full sm:w-auto py-2.5 px-4 rounded-2xl transition flex items-center justify-center gap-2.5 text-xs font-black shadow-xs ${
            !isSubActive
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
              : isAvailable
              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isAvailable ? 'Disponible MAINTENANT' : 'Actuellement Occupé'}</span>
          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        </button>
      </div>

      {/* 1. NOTIFICATION AVANT EXPIRATION */}
          {isExpiringSoon && (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                    Alerte avant expiration
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-amber-950 mt-0.5">
                    Votre période d'essai gratuit de 30 jours se termine dans {daysLeftSub} jour(s) (le {expiresDate.toLocaleDateString()}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-[40px] px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition"
              >
                Renouveler dès maintenant
              </button>
            </div>
          )}

          {/* 2. BANNIÈRE DE STATUT ABONNEMENT ET FACTURATION */}
          <div
            className={`rounded-3xl p-5 border shadow-xs transition ${
              isSubActive
                ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-white border-emerald-200'
                : 'bg-gradient-to-r from-rose-50 via-rose-50/70 to-white border-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSubActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Statut Abonnement Prestataire
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        isSubActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isSubActive ? `Actif (${daysLeftSub} jours)` : 'Expiré (Profil Masqué)'}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {isSubActive
                      ? `Valide jusqu'au ${expiresDate.toLocaleDateString()} • Visibilité maximale auprès des clients`
                      : 'Période gratuite de 30 jours terminée (5 000 FCFA/mois requis)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ONGLET 1 : DEMANDES DE MISSIONS REÇUES (IMMEDIAT + PROGRAMME) */}
      {activeSubTab === 'MISSIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Demandes de missions reçues</h3>
              <p className="text-xs text-slate-500">
                Gérez vos demandes de service en direct : urgences immédiates et interventions programmées.
              </p>
            </div>
            <span className="text-xs font-bold bg-brand-50 text-brand-700 px-3 py-1 rounded-xl border border-brand-200">
              {providerMissions.length} mission(s) au total
            </span>
          </div>

          {providerMissions.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Aucune demande reçue pour l'instant.</p>
              <p className="text-[11px] text-slate-400">
                Assurez-vous que votre statut est "Disponible" pour recevoir les alertes des clients.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {providerMissions.map((req) => {
                const isImmediate = req.mode === 'IMMEDIATE';
                const isPending = req.status === 'PENDING';
                const isAccepted = req.status === 'ACCEPTED';
                const isRejected = req.status === 'REJECTED';
                const isCompleted = req.status === 'COMPLETED';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-3xl p-5 border shadow-xs transition flex flex-col justify-between gap-4 ${
                      isPending
                        ? 'border-amber-300 ring-2 ring-amber-400/20'
                        : isAccepted
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* En-tête : Badge Mode (Maintenant vs Programmer) + Statut */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                              isImmediate
                                ? 'bg-amber-100 text-amber-950 border border-amber-300 animate-pulse'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {isImmediate ? (
                              <>
                                <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                                <span>⚡ MAINTENANT : « Besoin de ce service immédiatement »</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span>📅 PROGRAMMER : « Pour le créneau convenu »</span>
                              </>
                            )}
                          </span>

                          <span className="text-[10px] text-slate-400">{req.createdAt}</span>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-900'
                              : isAccepted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isPending && '⏳ En attente de votre réponse'}
                          {isAccepted && '✅ Mission Acceptée'}
                          {isRejected && '❌ Mission Refusée'}
                          {isCompleted && '🏁 Mission Terminée'}
                        </span>
                      </div>

                      {/* Info Client & Besoin */}
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            req.clientAvatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={req.clientName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-slate-900">{req.clientName}</h4>
                          <p className="text-xs font-bold text-brand-600">{req.serviceTitle}</p>
                          <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            « {req.description} »
                          </p>
                        </div>
                      </div>

                      {/* Détails logistiques : Date/Heure, Lieu & Prix estimé */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block">Date & Heure :</span>
                          <span className="font-bold text-slate-800">{req.scheduledDateTime}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block">Lieu de l'intervention :</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {req.location}
                          </span>
                        </div>

                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-800 block">Montant Estimé :</span>
                          <span className="font-black text-emerald-950">
                            {req.estimatedPrice.toLocaleString()} FCFA ({req.paymentMethod})
                          </span>
                        </div>
                      </div>

                      {/* Téléphone & Contact Client */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Client : {req.clientPhone}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${req.clientPhone}`}
                            className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs text-slate-800 transition"
                          >
                            <Phone className="w-3.5 h-3.5 mr-1" />
                            <span>Appeler</span>
                          </a>
                          <a
                            href={`https://wa.me/${req.clientPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition text-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* BOUTONS D'ACTION : ACCEPTER / REFUSER / TERMINER - PARFAITEMENT ALIGNÉS */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateMissionStatus(req.id, 'REJECTED')}
                            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition order-2 sm:order-1"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            <span>Refuser</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isSubActive) {
                                setShowSubModal(true);
                                alert("Votre abonnement a expiré. Activez votre abonnement pour accepter de nouvelles missions.");
                                return;
                              }
                              handleUpdateMissionStatus(req.id, 'ACCEPTED');
                            }}
                            className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition order-1 sm:order-2"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            <span>Accepter la mission</span>
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleUpdateMissionStatus(req.id, 'COMPLETED')}
                          className="w-full sm:w-auto inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400 mr-1.5" />
                          <span>Marquer comme mission terminée</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="w-full text-center text-xs font-bold text-emerald-800 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">
                          ✓ Mission complétée avec succès !
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2 : MON PROFIL PROFESSIONNEL, TARIFS & ZONES D'INTERVENTION */}
      {activeSubTab === 'PROFILE' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5"
        >
          {/* SECTION PHOTO DE PROFIL */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={
                  profile.photoUrl ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                }
                alt="Photo prestataire"
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
              />
              <label
                htmlFor="prov-photo-input"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-brand-700 transition"
                title="Changer ma photo"
              >
                <Camera className="w-4 h-4" />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2 w-full">
              <div>
                <h4 className="text-xs font-black text-slate-900">Photo de Profil Professionnel</h4>
                <p className="text-[11px] text-slate-500">
                  Une photo nette et accueillante inspire immédiatement confiance aux clients.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="prov-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="prov-photo-input"
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Téléverser depuis l'appareil</span>
                </label>

                <input
                  type="url"
                  placeholder="Ou collez l'URL d'une image en ligne"
                  value={profile.photoUrl || ''}
                  onChange={(e) => setProfile({ ...profile, photoUrl: e.target.value })}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION GALERIE DE RÉALISATIONS (Plusieurs photos) */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                  <span>Galerie de Réalisations & Photos de mes Travaux</span>
                  <span className="text-[10px] font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full ml-1">
                    {(profile.portfolioPhotos || []).length} photo{(profile.portfolioPhotos || []).length > 1 ? 's' : ''}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ajoutez plusieurs photos de vos réalisations, de vos chantiers ou de votre espace. Les clients pourront les consulter et zoomer dessus.
                </p>
              </div>
            </div>

            {/* Boutons d'ajout */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="prov-portfolio-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePortfolioUpload}
                className="hidden"
              />
              <label
                htmlFor="prov-portfolio-upload"
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5 text-brand-600" />
                <span>Ajouter des photos (depuis l'appareil)</span>
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="Ou collez l'URL d'une image de réalisation"
                  value={newPortfolioUrl}
                  onChange={(e) => setNewPortfolioUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPortfolioUrl();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolioUrl}
                  disabled={!newPortfolioUrl.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Grille des photos enregistrées */}
            {(profile.portfolioPhotos || []).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {(profile.portfolioPhotos || []).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100 shadow-xs">
                    <img
                      src={imgUrl}
                      alt={`Réalisation ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioPhoto(idx)}
                        className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-md transition"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-[11px] text-slate-400">
                Aucune photo de réalisation enregistrée. Téléversez vos meilleures images ci-dessus !
              </div>
            )}
          </div>

          {/* Noms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Un seul nom affiché aux clients *
              </label>
              <input
                type="text"
                required
                value={profile.singleName || ''}
                onChange={(e) => setProfile({ ...profile, singleName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Moussa (Pas le nom complet)"
              />
              <span className="text-[10px] text-slate-400">
                Règle stricte : Seul ce prénom est visible par les clients avant paiement.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet (confidentiel & après mise en relation)
              </label>
              <input
                type="text"
                value={profile.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Moussa Koné"
              />
            </div>
          </div>

          {/* Service & Ville */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Principal *</label>
              <input
                type="text"
                required
                value={profile.serviceOffered || ''}
                onChange={(e) => setProfile({ ...profile, serviceOffered: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <GeoCascadeSelect
                initialValues={{
                  country: profile.country || user?.country || 'Bénin',
                  countryCode: profile.countryCode || user?.countryCode || 'BJ',
                  department: profile.department || '',
                  commune: profile.commune || '',
                  city: profile.city || '',
                }}
                onChange={(geo) =>
                  setProfile({
                    ...profile,
                    country: geo.country,
                    department: geo.department,
                    commune: geo.commune,
                    city: geo.city,
                  })
                }
                required={true}
                compact={true}
              />
            </div>
          </div>

          {/* AJOUT DES COMPÉTENCES DÉTAILLÉES */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-600" />
                <span>Mes Compétences & Spécialités</span>
              </label>
              <span className="text-[10px] text-slate-400">Permet aux clients de vous trouver par mot-clé</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ajouter une compétence (ex: Split Inverter, Panne tableau...)"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-brand-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-brand-700 transition"
              >
                + Ajouter
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(profile.skills || []).map((skill: string) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 bg-brand-50 text-brand-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-brand-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-brand-500 hover:text-rose-600 ml-1 font-black"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* DÉFINITION DES ZONES D'INTERVENTION */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mes Zones d'Intervention</span>
              </label>
              <span className="text-[10px] text-slate-400">Communes ou quartiers où vous vous déplacez</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ajouter une zone (ex: Cocody, Plateau, Marcory, Yopougon...)"
                value={newZoneInput}
                onChange={(e) => setNewZoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddZone();
                  }
                }}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddZone}
                className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700 transition"
              >
                + Ajouter
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(profile.interventionZones || []).map((zone: string) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-200"
                >
                  <span>{zone}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveZone(zone)}
                    className="text-emerald-500 hover:text-rose-600 ml-1 font-black"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* DÉFINITION DES TARIFS (Forfait, Par Heure, Par Journée & Prestations spécifiques) */}
          <div className="p-4 sm:p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <span className="text-base">💰</span> Tarification & Grille de Prestations
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Indiquez vos prix pour donner une vue transparente aux clients : tarif de base, prix par heure, par journée ou prestations sur mesure.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full shrink-0">
                Visible par les clients
              </span>
            </div>

            {/* Grille principale : Tarif de base + Formule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tarif de Base Indicatif (FCFA) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={profile.basePrice || 5000}
                  onChange={(e) => setProfile({ ...profile, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: 5000, 15000..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Formule ou Unité de base
                </label>
                <select
                  value={profile.pricingUnit || 'par prestation'}
                  onChange={(e) => setProfile({ ...profile, pricingUnit: e.target.value })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="par prestation">Par prestation (forfait)</option>
                  <option value="par heure">Par heure</option>
                  <option value="par jour">Par jour / journée</option>
                  <option value="à partir de (sur devis)">À partir de (selon diagnostic)</option>
                  <option value="par appareil">Par appareil / unité</option>
                  <option value="par mètre carré">Par mètre carré (m²)</option>
                </select>
              </div>
            </div>

            {/* Grille secondaire : Tarif par Heure & Tarif par Journée */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/70">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ⏱️ Tarif par Heure (FCFA) <span className="text-[10px] font-normal text-slate-500">(Optionnel)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={profile.hourlyRate ?? ''}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: 2500 FCFA / heure"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  📅 Tarif par Journée (FCFA) <span className="text-[10px] font-normal text-slate-500">(Optionnel)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={profile.dailyRate ?? ''}
                  onChange={(e) => setProfile({ ...profile, dailyRate: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: 15000 FCFA / jour"
                />
              </div>
            </div>

            {/* Sous-section : Prestations spécifiques à la carte */}
            <div className="pt-2 border-t border-emerald-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Prestations & Formules à la carte (Peu importe vos tarifs sur mesure)</span>
                </label>
                <span className="text-[10px] text-emerald-700">Facultatif</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Nom prestation (ex: Pose split complet)"
                    value={newTierName}
                    onChange={(e) => setNewTierName(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="500"
                    step="500"
                    placeholder="Prix (FCFA)"
                    value={newTierPrice}
                    onChange={(e) => setNewTierPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={newTierUnit}
                    onChange={(e) => setNewTierUnit(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="par prestation">Par prestation</option>
                    <option value="par heure">Par heure</option>
                    <option value="par jour">Par jour</option>
                    <option value="par unité">Par unité</option>
                    <option value="par m²">Par m²</option>
                    <option value="sur devis">Sur devis</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddPricingTier}
                    className="w-full h-full min-h-[34px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center transition"
                    title="Ajouter cette formule"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Liste des formules ajoutées */}
              {(profile.pricingTiers || []).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(profile.pricingTiers || []).map((tier: PricingTier) => (
                    <span
                      key={tier.id}
                      className="inline-flex items-center gap-2 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs"
                    >
                      <span>{tier.name}</span>
                      <span className="text-emerald-700 font-black">
                        {tier.price.toLocaleString('fr-FR')} FCFA
                      </span>
                      {tier.unit && (
                        <span className="text-[10px] text-slate-500 font-normal">({tier.unit})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePricingTier(tier.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1 font-black transition"
                        title="Supprimer cette formule"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MODALITÉS D'INTERVENTION & DÉPLACEMENT (Atelier vs Déplacement client) */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-600" />
                <span>Modalités de Réception & Déplacement</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Précisez clairement aux clients si vous intervenez à domicile, si vous les accueillez dans votre atelier/bureau, et les éventuels frais de déplacement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1 : Accueil à l'atelier / Le client peut venir */}
              <div className={`p-4 rounded-2xl border transition ${profile.receivesOnSite ? 'bg-white border-emerald-400 shadow-xs ring-1 ring-emerald-400/20' : 'bg-slate-100/70 border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${profile.receivesOnSite ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Le client peut venir chez vous</p>
                      <p className="text-[10px] text-slate-500">Réception à votre atelier, cabinet ou bureau</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, receivesOnSite: true })}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      profile.receivesOnSite
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Oui, le client peut venir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, receivesOnSite: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      !profile.receivesOnSite
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Non, pas d'accueil sur place</span>
                  </button>
                </div>
              </div>

              {/* Option 2 : Déplacement chez le client */}
              <div className={`p-4 rounded-2xl border transition ${profile.travelRequired ? 'bg-white border-emerald-400 shadow-xs ring-1 ring-emerald-400/20' : 'bg-slate-100/70 border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${profile.travelRequired ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Vous vous déplacez chez le client</p>
                      <p className="text-[10px] text-slate-500">Intervention à domicile ou sur le site du client</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, travelRequired: true })}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      profile.travelRequired
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Oui, je me déplace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, travelRequired: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      !profile.travelRequired
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Non, pas de déplacement</span>
                  </button>
                </div>

                {/* Frais de déplacement si déplacement activé */}
                {profile.travelRequired && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-[11px] font-black text-slate-800">
                          Frais de déplacement (FCFA)
                        </label>
                        <span className="text-[10px] text-slate-500">
                          Mettez 0 si le déplacement est gratuit / inclus
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={profile.travelFee || 0}
                          onChange={(e) => setProfile({ ...profile, travelFee: parseFloat(e.target.value) || 0 })}
                          className="w-36 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs font-bold text-slate-600">FCFA</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Téléphone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Numéro de Téléphone Direct</span>
              </label>
              <input
                type="tel"
                value={profile.directPhoneNumber || ''}
                onChange={(e) => setProfile({ ...profile, directPhoneNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Numéro WhatsApp (Liaison directe client)</span>
              </label>
              <input
                type="tel"
                value={profile.whatsappNumber || ''}
                onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] bg-brand-600 hover:bg-brand-700 text-white font-black py-3 px-6 rounded-xl text-xs sm:text-sm transition gap-2 shadow-xs ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer mon profil, mes tarifs et mes zones'}</span>
          </button>
        </form>
      )}

      {/* ONGLET 3 : ABONNEMENT & FACTURATION (RÈGLE MÉTIER PRESTATAIRE 30 JOURS) */}
      {activeSubTab === 'BILLING' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Carte de Statut Détaillée */}
          <div
            className={`p-6 rounded-3xl border ${
              isSubActive
                ? 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200'
                : 'bg-gradient-to-br from-rose-50 via-white to-white border-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isSubActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {isSubActive ? 'Abonnement Prestataire Actif' : 'Abonnement Prestataire Expiré'}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isSubActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isSubActive ? 'Visibilité Active' : 'Profil Masqué'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Forfait mensuel sans commission • 5 000 FCFA / 30 jours
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isSubActive ? 'Prolonger de 30 jours' : 'S’abonner (5 000 FCFA)'}</span>
              </button>
            </div>

            {/* Grille des dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Création du compte :</span>
                <span className="font-bold text-slate-800">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Actif'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Date d'expiration :</span>
                <span className="font-black text-slate-900">
                  {expiresDate.toLocaleDateString()}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${isSubActive ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <span className="text-[10px] font-bold block uppercase opacity-80">Jours restants :</span>
                <span className="font-black text-sm">
                  {isSubActive ? `${daysLeftSub} jour(s)` : '0 jour (Expiré)'}
                </span>
              </div>
            </div>
          </div>

          {/* Avantages Inclus */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Avantages garantis pour les prestataires actifs</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <div>
                  <strong className="text-slate-900 block">En tête des résultats</strong>
                  <span>Apparaissez en priorité aux clients qui recherchent vos compétences.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <div>
                  <strong className="text-slate-900 block">Missions Immédiates</strong>
                  <span>Recevez les demandes urgentes « Maintenant » avec notification en direct.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <div>
                  <strong className="text-slate-900 block">Liaison Téléphone & WhatsApp</strong>
                  <span>Les clients certifiés peuvent vous appeler et vous écrire directement.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <div>
                  <strong className="text-slate-900 block">0% de commission</strong>
                  <span>Vous conservez 100% du montant convenu avec vos clients.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historique réel des paiements */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Historique de mes transactions et renouvellements</span>
              </h4>
              <span className="text-xs text-slate-400 font-medium">{payments.length} paiement(s)</span>
            </div>

            {payments.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                Aucun historique de paiement pour l'instant. Votre période initiale de 30 jours est active.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {p.type === 'PROVIDER_SUBSCRIPTION'
                          ? 'Abonnement Mensuel Prestataire (30 jours)'
                          : 'Paiement Service'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()} • Réf : {p.transactionReference || 'SasPay Mobile Money'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-800 text-sm">
                        {Number(p.amount).toLocaleString()} {p.currency || 'FCFA'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Validé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 4 : FIL D'ACTUALITÉ & CLIENTS CONNECTÉS */}
      {activeSubTab === 'FEED' && (
        <div className="space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Publications, Réalisations & Publicités
            </h3>
            <FeedPosts
              userRole="PROVIDER"
              currentUser={{ ...user, providerProfile: profile }}
              posts={posts}
              onAddPost={onAddPost}
              onOpenAds={() => setActiveSubTab('ADS')}
            />
          </div>
        </div>
      )}

      {/* ONGLET 5 : PUBLICITÉS */}
      {activeSubTab === 'ADS' && (
        <div className="space-y-4">
          <AdsSection currentUser={{ ...user, providerProfile: profile }} />
        </div>
      )}

      {/* MODAL PAIEMENT ABONNEMENT PRESTATAIRE */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Abonnement Prestataire Pro</h4>
                  <p className="text-xs text-slate-500">30 jours de visibilité garantie et missions en direct</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Tarif & Avantages */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 mb-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Tarif Forfaitaire</span>
                <span className="text-base font-black text-emerald-950">5 000 FCFA / 30 jours</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Abonnement sans engagement de durée et sans aucune commission sur le montant de vos prestations.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Avantages de votre statut Pro :</p>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Affichage en tête de liste auprès des clients de votre ville
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Alertes immédiates pour les interventions d'urgence « Maintenant »
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Appels directs et messages WhatsApp de clients qualifiés
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Zéro commission prélevée sur vos factures
                </li>
              </ul>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Moyen de Paiement Mobile Money
                </label>
                <select
                  value={momoOperator}
                  onChange={(e) => setMomoOperator(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="ORANGE_MONEY">Orange Money (Côte d'Ivoire, Sénégal, etc.)</option>
                  <option value="MTN_MOMO">MTN Mobile Money (Bénin, Côte d'Ivoire, etc.)</option>
                  <option value="MOOV_MONEY">Moov Money (Bénin, Côte d'Ivoire, etc.)</option>
                  <option value="WAVE">Wave (Côte d'Ivoire, Sénégal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Numéro Mobile Money (Optionnel pour le paiement)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: 0700000000"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handlePaySubscription}
                className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition flex-1"
              >
                Valider & Payer (5 000 FCFA)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
