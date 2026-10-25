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
} from 'lucide-react';
import { FeedPosts } from './FeedPosts';
import { AdsSection } from './AdsSection';
import { PostItem, ServiceRequest, ReviewItem } from '../types';
import { supabaseBackend } from '../config/supabase';
import { saspayClient } from '../config/saspay';

interface ProviderDashboardProps {
  user: any;
  token: string;
  posts: PostItem[];
  serviceRequests?: ServiceRequest[];
  onAddPost: (post: Partial<PostItem>) => void;
  onUpdateRequestStatus?: (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'PAID') => void;
  onUpdateProviderProfile?: (updatedProfile: any) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  user,
  token,
  posts,
  serviceRequests: externalRequests,
  onAddPost,
  onUpdateRequestStatus,
  onUpdateProviderProfile,
}) => {
  const [profile, setProfile] = useState<any>(
    user.providerProfile || {
      id: user?.id || 'prov-user',
      singleName: user?.firstName || 'Professionnel',
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Professionnel',
      photoUrl: user?.avatarUrl || '',
      serviceOffered: 'Services Spécialisés',
      skills: [],
      city: user?.city || 'Abidjan',
      department: user?.department || 'Centre',
      interventionZones: [],
      availability: 'AVAILABLE',
      receivesOnSite: true,
      travelRequired: false,
      travelFee: 0,
      basePrice: 5000,
      pricingUnit: 'par prestation',
      whatsappNumber: user?.phoneNumber || '',
      directPhoneNumber: user?.phoneNumber || '',
      rating: 0,
      reviewsCount: 0,
      completedMissions: 0,
      subscriptionExpiresAt: user?.providerProfile?.subscriptionExpiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    }
  );

  const [activeSubTab, setActiveSubTab] = useState<'MISSIONS' | 'PROFILE' | 'BILLING' | 'FEED' | 'ADS'>('MISSIONS');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoOperator, setMomoOperator] = useState('ORANGE_MONEY');
  const [payments, setPayments] = useState<any[]>([]);

  // Nouveaux tags de compétences et zones
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newZoneInput, setNewZoneInput] = useState('');

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
    if (onUpdateProviderProfile) onUpdateProviderProfile(profile);

    try {
      await supabaseBackend.updateProviderProfile(user?.id, profile);
    } catch {}

    setSuccessMsg('Profil professionnel, tarifs et zones d’intervention enregistrés avec succès !');
    setTimeout(() => setSuccessMsg(null), 3000);
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 1. NOTIFICATION AVANT EXPIRATION (SI MOINS DE 7 JOURS RESTANTS) */}
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

          {/* Boutons d'action regroupés et parfaitement alignés */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('BILLING')}
              className="inline-flex items-center justify-center min-h-[42px] px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
            >
              Historique des paiements
            </button>
            <button
              type="button"
              onClick={() => setShowSubModal(true)}
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-xs transition gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isSubActive ? 'Renouveler (5 000 FCFA)' : 'S’abonner (5 000 FCFA / mois)'}</span>
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DISPONIBILITÉ EN TEMPS RÉEL (1 CLIC) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ring-4 transition ${
              !isSubActive
                ? 'bg-slate-400 ring-slate-100'
                : isAvailable
                ? 'bg-emerald-500 ring-emerald-100 animate-pulse'
                : 'bg-rose-500 ring-rose-100'
            }`}
          />
          <div>
            <p className="text-sm font-black text-slate-900">
              {!isSubActive
                ? '⚠️ Statut Suspendu (Abonnement expiré)'
                : isAvailable
                ? '🟢 Vous êtes Disponible MAINTENANT'
                : '🔴 Actuellement Occupé'}
            </p>
            <p className="text-xs text-slate-500">
              {!isSubActive
                ? 'Renouvelez votre abonnement mensuel (5 000 FCFA) pour réactiver votre disponibilité et recevoir les demandes.'
                : isAvailable
                ? 'Les clients vous voient en tête de liste et peuvent réserver immédiatement ou programmer un créneau.'
                : 'Votre profil apparaît comme "Occupé" : les réservations immédiates sont suspendues.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAvailability}
          className={`inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 gap-2 ${
            !isSubActive
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
              : isAvailable
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {!isSubActive
              ? 'Activer mon statut'
              : isAvailable
              ? 'Passer en Occupé'
              : 'Passer en Disponible'}
          </span>
        </button>
      </div>

      {/* Barre d'onglets pour le Prestataire */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('MISSIONS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'MISSIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-brand-600" />
          <span>
            Demandes Reçues {pendingMissionsCount > 0 && `(${pendingMissionsCount})`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PROFILE')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'PROFILE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-slate-700" />
          <span>Profil, Tarifs & Zones</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('BILLING')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'BILLING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <span>Abonnement & Facturation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('FEED')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'FEED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Rss className="w-3.5 h-3.5 text-blue-600" />
          <span>Fil d'Actualité</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ADS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'ADS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-500" />
          <span>Publicités</span>
        </button>
      </div>

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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ville Principale *</label>
              <input
                type="text"
                required
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quartier de base *</label>
              <input
                type="text"
                required
                value={profile.department || ''}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
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

          {/* DÉFINITION DES TARIFS */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span className="text-base">💰</span> Définition de mes Tarifs
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Ce montant estimé est affiché de façon transparente au client avant réservation.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                Affiché aux clients
              </span>
            </div>

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
                  Formule ou Unité
                </label>
                <select
                  value={profile.pricingUnit || 'par prestation'}
                  onChange={(e) => setProfile({ ...profile, pricingUnit: e.target.value })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="par prestation">Par prestation (forfait)</option>
                  <option value="par climatiseur">Par climatiseur</option>
                  <option value="par heure">Par heure</option>
                  <option value="par jour">Par jour / journée</option>
                  <option value="à partir de (sur devis)">À partir de (selon diagnostic)</option>
                  <option value="par mètre carré">Par mètre carré (m²)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modalités Atelier & Déplacement */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Reçoit sur place (Atelier / Local)</p>
                  <p className="text-[11px] text-slate-500">Le client peut-il se déplacer chez vous ?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, receivesOnSite: true })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    profile.receivesOnSite ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, receivesOnSite: false })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    !profile.receivesOnSite ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Déplacement chez le client</p>
                    <p className="text-[11px] text-slate-500">Pouvez-vous intervenir au domicile du client ?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, travelRequired: true })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      profile.travelRequired ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, travelRequired: false })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      !profile.travelRequired ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    Non
                  </button>
                </div>
              </div>

              {profile.travelRequired && (
                <div className="mt-3 pl-6">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Frais de déplacement (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={profile.travelFee || 0}
                    onChange={(e) => setProfile({ ...profile, travelFee: parseFloat(e.target.value) || 0 })}
                    className="w-44 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}
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
              Publications & Réalisations
            </h3>
            <FeedPosts
              userRole="PROVIDER"
              currentUser={{ ...user, providerProfile: profile }}
              posts={posts}
              onAddPost={onAddPost}
            />
          </div>
        </div>
      )}

      {/* ONGLET 5 : PUBLICITÉS */}
      {activeSubTab === 'ADS' && (
        <div className="space-y-4">
          <AdsSection />
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
