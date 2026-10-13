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
} from 'lucide-react';
import { ConnectedClientsWidget } from './ConnectedClientsWidget';
import { FeedPosts } from './FeedPosts';
import { AdsSection } from './AdsSection';
import { PostItem } from '../types';

interface ProviderDashboardProps {
  user: any;
  token: string;
  posts: PostItem[];
  onAddPost: (post: Partial<PostItem>) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  user,
  token,
  posts,
  onAddPost,
}) => {
  const [profile, setProfile] = useState<any>(
    user.providerProfile || {
      singleName: 'Mamadou',
      fullName: 'Mamadou Traoré',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Climatisation & Froid',
      city: 'Abidjan',
      department: 'Cocody Riviera',
      availability: 'AVAILABLE',
      receivesOnSite: true,
      travelRequired: true,
      travelFee: 3000,
      whatsappNumber: '+2250701020304',
      directPhoneNumber: '+2250701020304',
      subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    }
  );

  const [activeSubTab, setActiveSubTab] = useState<'PROFILE' | 'FEED' | 'ADS'>('PROFILE');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoOperator, setMomoOperator] = useState('ORANGE_MONEY');

  const isAvailable = profile.availability === 'AVAILABLE';
  const expiresDate = new Date(profile.subscriptionExpiresAt);
  const isSubActive = expiresDate > new Date();

  // Basculer la disponibilité en 1 clic
  const toggleAvailability = async () => {
    const newStatus = isAvailable ? 'BUSY' : 'AVAILABLE';
    setProfile((prev: any) => ({ ...prev, availability: newStatus }));

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

    setSuccessMsg(`Statut mis à jour : ${newStatus === 'AVAILABLE' ? 'Disponible' : 'Occupé'}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Sauvegarder le profil et la photo
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
    setSuccessMsg('Profil et photo enregistrés avec succès !');
    setTimeout(() => setSuccessMsg(null), 3000);
    setLoading(false);
  };

  // Gestion du téléversement de la photo de profil prestataire
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev: any) => ({ ...prev, photoUrl: reader.result as string }));
        setSuccessMsg('Photo sélectionnée. Pensez à enregistrer vos modifications.');
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
                  {isSubActive ? 'Actif & Visible' : 'Expiré (Profil Masqué)'}
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
            Renouveler (5 000 FCFA)
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DISPONIBILITÉ EN 1 CLIC */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ring-4 transition ${
              isAvailable
                ? 'bg-emerald-500 ring-emerald-100 animate-pulse'
                : 'bg-rose-500 ring-rose-100'
            }`}
          />
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              {isAvailable ? 'Disponible pour des missions' : 'Actuellement Occupé'}
            </p>
            <p className="text-xs text-slate-500">
              {isAvailable
                ? 'Les clients peuvent débloquer votre contact et vous solliciter'
                : 'La mise en contact est bloquée pour les clients tant que vous êtes occupé'}
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
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold gap-1">
        <button
          onClick={() => setActiveSubTab('PROFILE')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'PROFILE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Mon Profil & Photo</span>
        </button>
        <button
          onClick={() => setActiveSubTab('FEED')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'FEED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Rss className="w-3.5 h-3.5" />
          <span>Fil d'Actualité & Clients Connectés</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ADS')}
          className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
            activeSubTab === 'ADS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Publicités Panafricaines</span>
        </button>
      </div>

      {/* ONGLET 1 : MON PROFIL ET PHOTO DU PRESTATAIRE */}
      {activeSubTab === 'PROFILE' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5"
        >
          {/* SECTION PHOTO DE PROFIL PRESTATAIRE */}
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
                <h4 className="text-xs font-black text-slate-900">
                  Photo de Profil du Prestataire
                </h4>
                <p className="text-[11px] text-slate-500">
                  Une photo soignée augmente vos chances de prise de contact par les clients.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Un seul nom affiché aux clients
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
                Règle : Seul ce prénom est visible par les clients avant paiement.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet (usage administratif & post-déblocage)
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Proposé</label>
              <input
                type="text"
                required
                value={profile.serviceOffered || ''}
                onChange={(e) => setProfile({ ...profile, serviceOffered: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ville</label>
              <input
                type="text"
                required
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Département / Quartier</label>
              <input
                type="text"
                required
                value={profile.department || ''}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* ENREGISTREMENT DU TARIF DU PRESTATAIRE */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span className="text-base">💰</span> Mon Tarif de Prestation
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Ce tarif sera clairement affiché aux clients avant qu'ils ne débloquent votre contact.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                Visible par les clients
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Montant indicatif (FCFA)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={profile.basePrice || 5000}
                  onChange={(e) => setProfile({ ...profile, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: 5000, 10000..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Unité ou formule de tarification
                </label>
                <select
                  value={profile.pricingUnit || 'par prestation'}
                  onChange={(e) => setProfile({ ...profile, pricingUnit: e.target.value })}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="par prestation">Par prestation (forfait)</option>
                  <option value="par heure">Par heure</option>
                  <option value="par jour">Par jour / journée</option>
                  <option value="à partir de (sur devis)">À partir de (devis selon chantier)</option>
                  <option value="par mètre carré">Par mètre carré (m²)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sur place & Déplacement */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Reçoit sur place</p>
                  <p className="text-[11px] text-slate-500">Possédez-vous un atelier ou local ?</p>
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
                    <p className="text-xs font-bold text-slate-800">Déplacement nécessaire</p>
                    <p className="text-[11px] text-slate-500">Vous déplacez-vous chez le client ?</p>
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
                    onChange={(e) => setProfile({ ...profile, travelFee: parseFloat(e.target.value) })}
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
                <span>Numéro WhatsApp (Liaison directe)</span>
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
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer mon profil et ma photo'}</span>
          </button>
        </form>
      )}

      {/* ONGLET 2 : FIL D'ACTUALITÉ, PUBLICATIONS ET CLIENTS CONNECTÉS */}
      {activeSubTab === 'FEED' && (
        <div className="space-y-6">
          {/* Widget : Clients connectés en direct dans le fil d'actualité */}
          <ConnectedClientsWidget />

          {/* Publications des prestataires */}
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

      {/* ONGLET 3 : PUBLICITÉS */}
      {activeSubTab === 'ADS' && (
        <div className="space-y-4">
          <AdsSection />
        </div>
      )}

      {/* MODAL PAIEMENT ABONNEMENT */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-black text-slate-900 mb-1">
              Abonnement Prestataire
            </h4>
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
