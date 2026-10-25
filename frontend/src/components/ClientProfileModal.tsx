import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Camera, Save, CheckCircle, CreditCard, Sparkles, AlertCircle, Clock } from 'lucide-react';
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
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );

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
            onClick={() => setActiveTab('SUBSCRIPTION')}
            className={`py-2 px-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SUBSCRIPTION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Abonnement</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasAccess ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </button>
        </div>

        {/* CONTENU ONGLET ABONNEMENT */}
        {activeTab === 'SUBSCRIPTION' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                hasAccess
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                {hasAccess ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {hasAccess
                    ? isSubActive
                      ? 'Abonnement Client Actif'
                      : 'Semaine Gratuite Active'
                    : 'Période Gratuite Expirée'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {hasAccess
                  ? isSubActive
                    ? `Votre abonnement est valide jusqu'au ${subExpires?.toLocaleDateString('fr-FR')}. Vous pouvez contacter tous les prestataires.`
                    : `Votre essai offert de 7 jours est en cours jusqu'au ${trialExpires?.toLocaleDateString('fr-FR')}.`
                  : "Votre essai de 7 jours a pris fin. Pour débloquer les coordonnées directes des prestataires, veuillez souscrire à l'abonnement."}
              </p>
            </div>

            {!hasAccess && onOpenSubscribe && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscribe();
                }}
                className="w-full inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white shadow-lg shadow-brand-500/25 transition gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Débloquer les contacts (S'abonner)</span>
              </button>
            )}

            {/* HISTORIQUE PAIEMENTS */}
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Historique des Transactions
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {payments.length > 0 ? (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{p.type}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString('fr-FR')} • {p.method}
                        </p>
                      </div>
                      <span className="font-black text-brand-600">
                        {p.amount?.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    Aucun paiement enregistré pour l'instant.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET COORDONNÉES */}
        {activeTab === 'DETAILS' && (
          <form onSubmit={handleSave} className="space-y-3.5">
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
                placeholder="Ex: +229 97 00 00 00"
              />
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
