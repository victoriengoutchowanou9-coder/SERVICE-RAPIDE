import React, { useState } from 'react';
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
} from 'lucide-react';
import { ConnectedClientsWidget } from './ConnectedClientsWidget';
import { FeedPosts } from './FeedPosts';
import { AdsSection } from './AdsSection';
import { PostItem, ServiceRequest, ReviewItem } from '../types';

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
      id: 'prov-1',
      singleName: 'Mamadou',
      fullName: 'Mamadou Traoré',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Climatisation & Froid',
      skills: ['Split Inverter', 'Recharge Gaz R410', 'Chambre froide', 'Dépannage d’urgence'],
      city: 'Abidjan',
      department: 'Cocody Riviera',
      interventionZones: ['Cocody', 'Plateau', 'Riviera', 'Marcory', 'Bingerville'],
      availability: 'AVAILABLE',
      receivesOnSite: true,
      travelRequired: true,
      travelFee: 2500,
      basePrice: 15000,
      pricingUnit: 'par climatiseur',
      whatsappNumber: '+2250701020304',
      directPhoneNumber: '+2250701020304',
      rating: 4.9,
      reviewsCount: 38,
      completedMissions: 84,
      subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    }
  );

  const [activeSubTab, setActiveSubTab] = useState<'MISSIONS' | 'PROFILE' | 'REVIEWS' | 'FEED' | 'ADS'>('MISSIONS');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoOperator, setMomoOperator] = useState('ORANGE_MONEY');

  // Nouveaux tags de compétences et zones
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newZoneInput, setNewZoneInput] = useState('');

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

  const isAvailable = profile.availability === 'AVAILABLE';
  const expiresDate = new Date(profile.subscriptionExpiresAt);
  const isSubActive = expiresDate > new Date();

  // Avis du prestataire
  const mockReviews: ReviewItem[] = profile.reviews || [
    {
      id: 'rev-1',
      clientName: 'Awa K.',
      rating: 5,
      comment: 'Intervention ultra rapide pour mon split inverter à Cocody. Très poli, travail propre et tarif respecté.',
      date: 'Il y a 2 jours',
    },
    {
      id: 'rev-2',
      clientName: 'Michel D.',
      rating: 5,
      comment: 'Climatisation réparée en moins d’une heure. Je recommande vivement pour son sérieux !',
      date: 'La semaine dernière',
    },
    {
      id: 'rev-3',
      clientName: 'Ibrahim S.',
      rating: 4,
      comment: 'Arrivé à l’heure convenue pour le rendez-vous programmé à 10h. Très bon travail.',
      date: 'Il y a 2 semaines',
    },
  ];

  // Basculer la disponibilité en 1 clic
  const toggleAvailability = async () => {
    const newStatus = isAvailable ? 'BUSY' : 'AVAILABLE';
    const updated = { ...profile, availability: newStatus };
    setProfile(updated);
    if (onUpdateProviderProfile) onUpdateProviderProfile(updated);

    try {
      await fetch('http://localhost:3000/provider/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ availability: newStatus }),
      });
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
      await fetch('http://localhost:3000/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
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

  const handlePaySubscription = () => {
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
      {/* Bannière de Statut Abonnement */}
      <div
        className={`rounded-3xl p-5 border shadow-xs transition ${
          isSubActive
            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-white border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isSubActive ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Statut Abonnement Prestataire
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSubActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isSubActive ? 'Actif & Visible en Ligne' : 'Expiré (Profil Masqué)'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {isSubActive
                  ? `Valide jusqu'au ${expiresDate.toLocaleDateString()}`
                  : 'Sans abonnement actif (5000 FCFA), votre profil n’est pas visible aux clients'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSubModal(true)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            Renouveler (5 000 FCFA Mobile Money)
          </button>
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
              isAvailable
                ? 'bg-emerald-500 ring-emerald-100 animate-pulse'
                : 'bg-rose-500 ring-rose-100'
            }`}
          />
          <div>
            <p className="text-sm font-black text-slate-900">
              {isAvailable ? '🟢 Vous êtes Disponible MAINTENANT' : '🔴 Actuellement Occupé'}
            </p>
            <p className="text-xs text-slate-500">
              {isAvailable
                ? 'Les clients vous voient en tête de liste et peuvent réserver immédiatement ou programmer un créneau.'
                : 'Votre profil apparaît comme "Occupé" : les réservations immédiates sont suspendues.'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleAvailability}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition shrink-0 ${
            isAvailable
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isAvailable ? 'Passer en Occupé' : 'Passer en Disponible'}</span>
        </button>
      </div>

      {/* Barre d'onglets pour le Prestataire */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('MISSIONS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'MISSIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-brand-600" />
          <span>
            Demandes Reçues {pendingMissionsCount > 0 && `(${pendingMissionsCount} nouvelles)`}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('PROFILE')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'PROFILE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-slate-700" />
          <span>Profil, Tarifs & Zones</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REVIEWS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'REVIEWS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Avis & Évaluations ({profile.rating}★)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('FEED')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
            activeSubTab === 'FEED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Rss className="w-3.5 h-3.5 text-blue-600" />
          <span>Fil d'Actualité</span>
        </button>

        <button
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
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Client : {req.clientPhone}</span>
                        </span>
                        <a
                          href={`tel:${req.clientPhone}`}
                          className="text-[11px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-0.5 rounded-lg text-slate-800"
                        >
                          Appeler
                        </a>
                        <a
                          href={`https://wa.me/${req.clientPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* BOUTONS D'ACTION : ACCEPTER / REFUSER / TERMINER */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateMissionStatus(req.id, 'ACCEPTED')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accepter la mission</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateMissionStatus(req.id, 'REJECTED')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Refuser</span>
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleUpdateMissionStatus(req.id, 'COMPLETED')}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Marquer comme mission terminée</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="w-full text-center text-xs font-bold text-emerald-800 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
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
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer mon profil, mes tarifs et mes zones'}</span>
          </button>
        </form>
      )}

      {/* ONGLET 3 : AVIS, NOTES & ÉVALUATIONS REÇUES */}
      {activeSubTab === 'REVIEWS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Mes Évaluations & Réputation</h3>
                <p className="text-xs text-slate-500">
                  Notes laissées par les clients ayant validé une mission avec vous
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-2xl font-black text-amber-500">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <span>{profile.rating || 4.9}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Sur {profile.reviewsCount || 38} avis
                  </span>
                </div>

                <div className="h-10 w-px bg-slate-200" />

                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600">
                    {profile.completedMissions || 84}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Missions réussies</span>
                </div>
              </div>
            </div>

            {/* Liste des avis reçus */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Derniers avis clients
              </h4>

              {mockReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{rev.clientName}</span>
                      <span className="text-[10px] text-slate-400">• {rev.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic">« {rev.comment} »</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 4 : FIL D'ACTUALITÉ & CLIENTS CONNECTÉS */}
      {activeSubTab === 'FEED' && (
        <div className="space-y-6">
          <ConnectedClientsWidget />

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

      {/* MODAL PAIEMENT ABONNEMENT */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-black text-slate-900 mb-1">Abonnement Prestataire</h4>
            <p className="text-xs text-slate-500 mb-4">
              Tarif : <strong>5 000 FCFA</strong> pour 30 jours de visibilité garantie.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Opérateur Mobile Money
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Numéro Mobile Money
                </label>
                <input
                  type="tel"
                  placeholder="Ex: 0700000000"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSubModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handlePaySubscription}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm"
              >
                Payer 5 000 FCFA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
