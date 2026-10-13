import React, { useState } from 'react';
import { User, Briefcase, Sparkles, Check, ArrowRight } from 'lucide-react';

interface RoleSelectionModalProps {
  onRoleChosen: (roleData: any) => void;
  token: string;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  onRoleChosen,
  token,
}) => {
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'PROVIDER' | null>(null);
  const [loading, setLoading] = useState(false);

  // Informations initiales si Prestataire
  const [singleName, setSingleName] = useState('');
  const [serviceOffered, setServiceOffered] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);

    const payload: any = { role: selectedRole };
    if (selectedRole === 'PROVIDER') {
      payload.singleName = singleName || 'Professionnel';
      payload.serviceOffered = serviceOffered || 'Services Généraux';
      payload.city = city || 'Abidjan';
      payload.department = department || 'Centre';
      payload.phoneNumber = phone;
      payload.whatsappNumber = phone;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/choose-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      onRoleChosen({ role: selectedRole, details: data });
    } catch {
      // Fallback local
      onRoleChosen({ role: selectedRole, details: payload });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-brand-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            Bienvenue sur SERVICE RAPIDE !
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Veuillez définir votre profil pour commencer sur la plateforme :
          </p>
        </div>

        {/* 1. CHOIX DU ROLE : CLIENT OU PRESTATAIRE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Option Client */}
          <div
            onClick={() => setSelectedRole('CLIENT')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition relative flex flex-col justify-between ${
              selectedRole === 'CLIENT'
                ? 'border-brand-600 bg-emerald-50/50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            {selectedRole === 'CLIENT' && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Je suis Client</h4>
              <p className="text-xs text-slate-500 mt-1">
                Je cherche un professionnel de confiance (plombier, mécanicien, etc.).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                🎁 1 semaine gratuite offerte
              </span>
            </div>
          </div>

          {/* Option Prestataire */}
          <div
            onClick={() => setSelectedRole('PROVIDER')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition relative flex flex-col justify-between ${
              selectedRole === 'PROVIDER'
                ? 'border-brand-600 bg-emerald-50/50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            {selectedRole === 'PROVIDER' && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Je suis Prestataire</h4>
              <p className="text-xs text-slate-500 mt-1">
                Je propose mes services et compétences pour trouver des clients.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                🎁 1 mois gratuit offert
              </span>
            </div>
          </div>
        </div>

        {/* Détails complémentaires si Prestataire */}
        {selectedRole === 'PROVIDER' && (
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Profil Professionnel Initial
            </h5>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Un seul nom (visible par les clients)
              </label>
              <input
                type="text"
                placeholder="Ex: Moussa, Koffi, Fatou, Jean"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Service proposé
                </label>
                <input
                  type="text"
                  placeholder="Ex: Électricien"
                  value={serviceOffered}
                  onChange={(e) => setServiceOffered(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cotonou, Dakar..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Département / Commune
                </label>
                <input
                  type="text"
                  placeholder="Ex: Littoral, Plateau"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+225 / +229..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selectedRole || loading}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
        >
          {loading ? 'Configuration en cours...' : 'Confirmer mon choix'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
