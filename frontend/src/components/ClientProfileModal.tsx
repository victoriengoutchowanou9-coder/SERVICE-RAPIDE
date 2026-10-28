import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Camera, Save, CheckCircle, CreditCard, Sparkles, AlertCircle, Clock, Calendar } from 'lucide-react';
import { supabaseBackend } from '../config/supabase';
import { saspayClient } from '../config/saspay';
import { GeoCascadeSelect, GeoSelection } from './GeoCascadeSelect';

interface ClientProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
  onOpenSubscribe?: () => void;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  user,
  onClose,
  onUpdate,
  onOpenSubscribe,
}) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ? user.birthDate.split('T')[0] : '');
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [geo, setGeo] = useState<GeoSelection>({
    country: user?.country || 'Bénin',
    countryCode: user?.countryCode || 'BJ',
    department: user?.department || '',
    commune: user?.commune || '',
    city: user?.city || '',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'PAYMENTS'>('DETAILS');

  useEffect(() => {
    if (user?.id) {
      supabaseBackend.getPaymentHistory(user.id).then((history) => {
        setPayments(history);
      });
    }
  }, [user?.id]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 3 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updated = {
      ...user,
      firstName,
      lastName,
      phoneNumber,
      birthDate: birthDate || null,
      country: geo.country,
      countryCode: geo.countryCode,
      department: geo.department,
      commune: geo.commune,
      city: geo.city,
      avatarUrl,
    };

    try {
      await supabaseBackend.updateClientProfile(user.id, {
        firstName,
        lastName,
        phoneNumber,
        avatarUrl,
        birthDate: birthDate || undefined,
        country: geo.country,
        countryCode: geo.countryCode,
        department: geo.department,
        commune: geo.commune,
        city: geo.city,
      });
    } catch (err) {
      console.warn('Update client profile error:', err);
    }

    onUpdate(updated);
    setLoading(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* EN-TETE MODALE */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Mon Profil & Accès Client
            </h3>
            <p className="text-[11px] text-slate-500">
              Gérez vos informations et votre abonnement
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* ONGLETS PROFIL / ABONNEMENT */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('DETAILS')}
            className={`py-2 px-3 text-xs font-black rounded-xl transition ${
              activeTab === 'DETAILS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mes Coordonnées
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENTS')}
            className={`py-2 px-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PAYMENTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mes Déblocages & Paiements</span>
          </button>
        </div>

        {/* CONTENU ONGLET DÉBLOCAGES & PAIEMENTS */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-emerald-50/70 text-slate-900 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-emerald-950">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Formule Client à l'Acte (Sans Abonnement)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                En tant que client, vous n'avez aucun abonnement ni prélèvement périodique. Vous payez uniquement 1 000 FCFA à la demande pour débloquer le numéro de téléphone et le WhatsApp du prestataire dont vous avez besoin.
              </p>
            </div>

            {/* HISTORIQUE PAIEMENTS */}
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Historique des Déblocages de Contacts
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {payments.length > 0 ? (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {p.type === 'CONTACT_UNLOCK' ? 'Déblocage contact prestataire' : p.type}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString('fr-FR')} • {p.method || 'SasPay Mobile Money'}
                        </p>
                      </div>
                      <span className="font-black text-brand-600">
                        {p.amount ? p.amount.toLocaleString('fr-FR') : '1 000'} FCFA
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    Aucun déblocage de contact enregistré pour l'instant.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET COORDONNÉES */}
        {activeTab === 'DETAILS' && (
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* PHOTO DE PROFIL DU CLIENT */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt="Photo de profil"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/20 shadow-xs"
                />
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </label>
              </div>

              <div className="flex-1 w-full space-y-1 text-center sm:text-left">
                <span className="text-xs font-black text-slate-800 block">Photo de profil client</span>
                <p className="text-[10px] text-slate-500">
                  Personnalisez votre compte avec votre photo personnelle.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                    <Camera className="w-3.5 h-3.5 text-brand-600" />
                    <span>Changer de photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] font-bold text-slate-500 hover:text-brand-600 underline"
                  >
                    {showUrlInput ? 'Masquer URL' : 'Par lien URL'}
                  </button>
                </div>
                {showUrlInput && (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: 97 00 00 00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>Date de naissance *</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            {/* CASCADE GÉOGRAPHIQUE */}
            <div className="pt-2 border-t border-slate-100">
              <GeoCascadeSelect
                initialValues={{
                  country: geo.country,
                  countryCode: geo.countryCode,
                  department: geo.department,
                  commune: geo.commune,
                  city: geo.city,
                }}
                onChange={setGeo}
                required={false}
                compact={true}
              />
            </div>

            {/* BOUTONS PARFAITEMENT ALIGNÉS */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white shadow-xs transition gap-1.5"
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
