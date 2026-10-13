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
} from 'lucide-react';
import { ProviderItem, PostItem } from '../types';
import { AdsSection } from './AdsSection';
import { FeedPosts } from './FeedPosts';
import { ClientProfileModal } from './ClientProfileModal';

interface ClientViewProps {
  user: any;
  token: string;
  country: string;
  posts: PostItem[];
  onAddPost: (post: Partial<PostItem>) => void;
  onUpdateUser: (updatedUser: any) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({
  user,
  token,
  country,
  posts,
  onAddPost,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'FEED' | 'ADS'>('PROVIDERS');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  // Modales
  const [unlockModalProvider, setUnlockModalProvider] = useState<ProviderItem | null>(null);
  const [refundModalItem, setRefundModalItem] = useState<ProviderItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [momoOperator, setMomoOperator] = useState('ORANGE_MONEY');
  const [momoPhone, setMomoPhone] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const trialExpires = user.clientTrialExpiresAt ? new Date(user.clientTrialExpiresAt) : null;
  const isTrialActive = trialExpires && trialExpires > new Date();

  // Liste des prestataires avec photos et statut connecté
  const mockProviders: ProviderItem[] = [
    {
      id: 'prov-1',
      singleName: 'Mamadou',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Climatisation & Réfrigération',
      city: 'Abidjan',
      department: 'Cocody',
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: true,
      travelRequired: true,
      travelFee: 2500,
      basePrice: 15000,
      pricingUnit: 'par climatiseur',
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '•••••••••• (Masqué)', whatsappNumber: '•••••••••• (Masqué)' },
    },
    {
      id: 'prov-2',
      singleName: 'Koffi',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Électricien Bâtiment',
      city: 'Cotonou',
      department: 'Littoral',
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: false,
      travelRequired: true,
      travelFee: 2000,
      basePrice: 8000,
      pricingUnit: 'par intervention',
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '•••••••••• (Masqué)', whatsappNumber: '•••••••••• (Masqué)' },
    },
    {
      id: 'prov-3',
      singleName: 'Fatou',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Coiffure & Esthétique Afro',
      city: 'Dakar',
      department: 'Almadies',
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: true,
      travelRequired: false,
      travelFee: 0,
      basePrice: 5000,
      pricingUnit: 'par coiffure',
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '•••••••••• (Masqué)', whatsappNumber: '•••••••••• (Masqué)' },
    },
    {
      id: 'prov-4',
      singleName: 'Bakary',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Mécanique Auto & Dépannage',
      city: 'Bamako',
      department: 'Commune IV',
      availability: 'BUSY', // OCCUPÉ
      isOnline: false,
      receivesOnSite: true,
      travelRequired: true,
      travelFee: 4000,
      basePrice: 12000,
      pricingUnit: 'par diagnostic',
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '•••••••••• (Masqué)', whatsappNumber: '•••••••••• (Masqué)' },
    },
    {
      id: 'prov-5',
      singleName: 'Jean',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Plombier Sanitaire Expert',
      city: 'Douala',
      department: 'Bonapriso',
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: false,
      travelRequired: true,
      travelFee: 3000,
      basePrice: 10000,
      pricingUnit: 'par intervention',
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '•••••••••• (Masqué)', whatsappNumber: '•••••••••• (Masqué)' },
    },
  ];

  useEffect(() => {
    setProviders(mockProviders);
  }, [country]);

  // Déblocage contact
  const handleConfirmUnlock = async () => {
    if (!unlockModalProvider) return;
    const prov = unlockModalProvider;

    if (prov.availability === 'BUSY') {
      alert('Impossible : Ce prestataire est actuellement OCCUPÉ.');
      return;
    }

    setProviders((prev) =>
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
        ? 'Contact débloqué GRATUITEMENT grâce à votre semaine offerte !'
        : 'Contact débloqué avec succès (1 000 FCFA Mobile Money).'
    );
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Demande remboursement
  const handleRequestRefund = async () => {
    if (!refundModalItem || !refundModalItem.unlockId) return;

    setProviders((prev) =>
      prev.map((p) =>
        p.id === refundModalItem.id ? { ...p, refundStatus: 'PENDING' } : p
      )
    );

    setRefundModalItem(null);
    setRefundReason('');
    setActionMsg('Votre demande de remboursement a été envoyée pour validation manuelle par l’administrateur.');
    setTimeout(() => setActionMsg(null), 5000);
  };

  // Filtrage
  const filtered = providers.filter((p) => {
    const matchService =
      p.serviceOffered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.singleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity = selectedCity
      ? p.city.toLowerCase().includes(selectedCity.toLowerCase())
      : true;
    const matchOnline = filterOnlineOnly ? p.isOnline : true;
    return matchService && matchCity && matchOnline;
  });

  const onlineProvidersCount = providers.filter((p) => p.isOnline).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profil Client & Bannière */}
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
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
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
                'Compte Client Actif'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowProfileModal(true)}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs transition"
        >
          <User className="w-3.5 h-3.5" />
          <span>Gérer Mon Profil & Photo</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Barre d'onglets pour le Client */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'PROVIDERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>
            Prestataires ({onlineProvidersCount} Connectés)
          </span>
        </button>
        <button
          onClick={() => setActiveTab('FEED')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'FEED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Rss className="w-3.5 h-3.5" />
          <span>Fil d'Actualité des Prestataires</span>
        </button>
        <button
          onClick={() => setActiveTab('ADS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'ADS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Publicités & Bons Plans</span>
        </button>
      </div>

      {/* ONGLET 1 : LISTE DES PRESTATAIRES CONNECTÉS */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4">
          {/* Recherche & Filtres */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher un service ou un prestataire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:w-48">
                <input
                  type="text"
                  placeholder="Filtrer par ville..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={filterOnlineOnly}
                  onChange={(e) => setFilterOnlineOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Afficher uniquement les prestataires connectés en ligne</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {filtered.length} prestataire(s) trouvé(s)
              </span>
            </div>
          </div>

          {/* Grille des Prestataires avec photo de profil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isBusy = item.availability === 'BUSY';
              const isUnlocked = item.isContactUnlocked;

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
                    {/* En-tête : Photo + Un seul nom + Disponibilité */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              item.photoUrl ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.singleName}
                            className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                          />
                          {item.isOnline && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                              title="Prestataire en ligne"
                            />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            {/* RÈGLE STRICTE : Un seul nom visible avant déblocage */}
                            <h4 className="text-sm font-black text-slate-900">
                              {isUnlocked && item.contact.fullName
                                ? item.contact.fullName
                                : item.singleName}
                            </h4>
                            {item.isOnline && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                En ligne
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-brand-600 mt-0.5">
                            {item.serviceOffered}
                          </p>
                        </div>
                      </div>

                      {/* Disponibilité */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${
                          isBusy
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBusy ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}
                        />
                        <span>{isBusy ? 'Occupé' : 'Disponible'}</span>
                      </span>
                    </div>

                    {/* Ville & Quartier */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {item.city}, {item.department}
                      </span>
                    </div>

                    {/* TARIF DU PRESTATAIRE VISIBLE AVANT TOUT CONTACT */}
                    <div className="mb-3.5 p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200/90 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          Tarif proposé
                        </span>
                        <p className="text-sm font-black text-emerald-950 leading-tight">
                          {(item.basePrice || 5000).toLocaleString()} FCFA
                          <span className="text-[11px] font-semibold text-emerald-700 ml-1">
                            / {item.pricingUnit || 'prestation'}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-xs">
                        Visible avant contact
                      </span>
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
                          Déplacement :{' '}
                          {item.travelRequired ? `Oui (${item.travelFee} FCFA)` : 'Non'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Zone de Contact */}
                  <div className="pt-3 border-t border-slate-100">
                    {isUnlocked ? (
                      <div className="space-y-2">
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
                                Signaler un problème / Remboursement
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
                                  WhatsApp
                                </a>
                              </div>
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
                              <span>Prestataire Occupé : Mise en contact impossible</span>
                            </div>
                            <span className="text-[10px] bg-rose-200 text-rose-900 font-extrabold px-2 py-0.5 rounded-md">
                              Bloqué
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUnlockModalProvider(item)}
                            className="w-full bg-slate-900 hover:bg-brand-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isTrialActive
                                ? 'Débloquer le contact (Gratuit - 1 sem.)'
                                : 'Débloquer le contact (1 000 FCFA)'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ONGLET 2 : FIL D'ACTUALITÉ DES PRESTATAIRES */}
      {activeTab === 'FEED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Réalisations & Conseils des Prestataires
            </h3>
            <span className="text-[10px] text-slate-400">Fil d'actualité actif</span>
          </div>
          <FeedPosts
            userRole="CLIENT"
            currentUser={user}
            posts={posts}
            onAddPost={onAddPost}
          />
        </div>
      )}

      {/* ONGLET 3 : PUBLICITÉS PANAFRICAINES */}
      {activeTab === 'ADS' && (
        <div className="space-y-4">
          <AdsSection />
        </div>
      )}

      {/* Modal Profil Client */}
      {showProfileModal && (
        <ClientProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={onUpdateUser}
        />
      )}

      {/* Modal Déblocage Contact */}
      {unlockModalProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-black text-slate-900 mb-1">
              Mise en Contact Sécurisée
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Prestataire : <strong>{unlockModalProvider.singleName}</strong> (
              {unlockModalProvider.serviceOffered})
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numéro de Téléphone
                  </label>
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
            <h4 className="text-base font-black text-slate-900 mb-1">
              Demande de Remboursement
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Chaque demande est soumise à validation manuelle par l'administrateur.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Motif de votre réclamation
              </label>
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
