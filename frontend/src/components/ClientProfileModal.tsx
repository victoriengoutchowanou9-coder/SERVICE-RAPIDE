import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Camera, Save, CheckCircle, CreditCard, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { supabaseBackend } from '../config/supabase';
import { saspayClient } from '../config/saspay';

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
  const [city, setCity] = useState(user?.city || 'Abidjan');
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'SUBSCRIPTION'>('DETAILS');

  // Calcul du statut de l'abonnement et de l'essai
  const trialExpires = user?.clientTrialExpiresAt ? new Date(user.clientTrialExpiresAt) : null;
  const isTrialActive = trialExpires ? trialExpires > new Date() : false;

  const subExpires = user?.clientSubscriptionExpiresAt ? new Date(user.clientSubscriptionExpiresAt) : null;
  const isSubActive = subExpires ? subExpires > new Date() : false;

  const hasAccess = isTrialActive || isSubActive;

  useEffect(() => {
    if (user?.id) {
      supabaseBackend.getPaymentHistory(user.id).then((history) => {
        setPayments(history);
      });
    }
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updated = {
      ...user,
      firstName,
      lastName,
      phoneNumber,
      city,
      avatarUrl,
    };

    try {
      await supabaseBackend.updateClientProfile(user.id, {
        firstName,
        lastName,
        phoneNumber,
        avatarUrl,
        city,
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

  const handlePayClientPass = async () => {
    try {
      const checkoutUrl = await saspayClient.createCheckoutSession({
        amount: 3000,
        customer_email: user?.email || 'client@servicerapide.africa',
        customer_name: `${firstName} ${lastName}`.trim() || 'Client SERVICE RAPIDE',
        customer_phone: phoneNumber || '',
        metadata: {
          userId: user?.id,
          action: 'CLIENT_SUBSCRIPTION',
        },
      });
      window.location.href = checkoutUrl;
    } catch (err: any) {
      alert("Erreur lors de l'initialisation du paiement SasPay : " + (err.message || 'Vérifiez votre connexion'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Espace Profil Client</h3>
              <p className="text-[11px] text-slate-500">Coordonnées, statut de l'abonnement et historique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Onglets internes : Informations vs Abonnement & Paiements */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-4 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('DETAILS')}
            className={`flex-1 py-2 px-3 rounded-lg transition text-center ${
              activeTab === 'DETAILS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mes Coordonnées
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUBSCRIPTION')}
            className={`flex-1 py-2 px-3 rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'SUBSCRIPTION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-brand-600" />
            <span>Abonnement & Accès</span>
          </button>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 mb-3 shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profil mis à jour avec succès !</span>
          </div>
        )}

        {/* CONTENU ONGLET 1 : COORDONNEES & FORMULAIRE */}
        {activeTab === 'DETAILS' && (
          <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Photo de profil Client */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/30"
                />
                <label
                  htmlFor="avatar-file-input"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-brand-700 transition"
                  title="Changer la photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </label>
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Photo de profil</label>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setAvatarUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Ou URL directe d'image"
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: Awa"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: Kouassi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: +225 07 00 00 00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville / Commune</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[42px] focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: Abidjan Cocody"
                />
              </div>
            </div>

            {/* BOUTONS PARFAITEMENT ALIGNES */}
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
                className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer mon profil'}</span>
              </button>
            </div>
          </form>
        )}

        {/* CONTENU ONGLET 2 : STATUT D'ABONNEMENT ET PAIEMENTS */}
        {activeTab === 'SUBSCRIPTION' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Carte de statut principale */}
            <div
              className={`p-4 rounded-2xl border ${
                hasAccess
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-rose-50/80 border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {hasAccess ? (
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <h4 className="text-sm font-black text-slate-900">
                    {isSubActive
                      ? 'Abonnement Client Actif'
                      : isTrialActive
                      ? 'Période d’Essai Gratuite (7 jours)'
                      : 'Période Gratuite Expirée'}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    hasAccess ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {hasAccess ? 'Accès Contacts Autorisé' : 'Contacts Bloqués'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {isSubActive
                  ? `Votre abonnement client est valable jusqu'au ${subExpires?.toLocaleDateString()} à ${subExpires?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Vous pouvez contacter les prestataires en direct.`
                  : isTrialActive
                  ? `Vous bénéficiez de votre semaine offerte jusqu'au ${trialExpires?.toLocaleDateString()} (${Math.max(0, Math.ceil((trialExpires.getTime() - Date.now()) / (1000 * 3600 * 24)))} jours restants). Accès 100% gratuit.`
                  : 'Votre période d’essai de 7 jours est arrivée à échéance. Pour débloquer les coordonnées directes (téléphone & WhatsApp) des prestataires, vous pouvez activer un abonnement mensuel ou régler les frais de contact par Mobile Money.'}
              </p>

              {!hasAccess && (
                <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handlePayClientPass}
                    className="flex-1 inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-black bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pass Mensuel Illimité (3 000 FCFA / 30 jours)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Avantages de l'accès client */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Avantages de votre accès client :
              </h5>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Accès immédiat aux numéros directs et WhatsApp de tous les prestataires certifiés.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Réservations urgentes « Maintenant » et programmations de créneaux.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span> Garantie et assistance du support 24/7 en cas de problème.
                </li>
              </ul>
            </div>

            {/* Historique des paiements */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Historique de mes transactions</span>
                </h5>
                <span className="text-[10px] text-slate-400">{payments.length} transaction(s)</span>
              </div>

              {payments.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  Aucun paiement effectué pour le moment.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {p.type === 'PROVIDER_SUBSCRIPTION'
                            ? 'Abonnement Prestataire'
                            : 'Mise en relation / Déblocage Contact'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString()} • Réf : {p.transactionReference || 'SasPay'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-700">
                          {Number(p.amount).toLocaleString()} {p.currency || 'FCFA'}
                        </span>
                        <span className="block text-[10px] font-bold text-emerald-600">✓ Validé</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
