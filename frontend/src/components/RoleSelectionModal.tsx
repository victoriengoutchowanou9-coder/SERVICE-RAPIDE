import React, { useState } from 'react';
import { User, Briefcase, Sparkles, Check, ArrowRight } from 'lucide-react';
import { supabaseBackend } from '../config/supabase';
import { GeoCascadeSelect, GeoSelection } from './GeoCascadeSelect';

interface RoleSelectionModalProps {
  user?: any;
  onRoleChosen: (roleData: any) => void;
  token?: string;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  user,
  onRoleChosen,
  token,
}) => {
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'PROVIDER' | null>(null);
  const [loading, setLoading] = useState(false);

  // Informations initiales si Prestataire
  const [singleName, setSingleName] = useState(user?.firstName || '');
  const [serviceOffered, setServiceOffered] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  // Localisation en cascade
  const [geo, setGeo] = useState<GeoSelection>({
    country: user?.country || 'Bénin',
    countryCode: user?.countryCode || 'BJ',
    department: user?.department || '',
    commune: user?.commune || '',
    city: user?.city || '',
  });

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);

    const targetUserId = user?.id || token || '';

    const payload: any = {
      role: selectedRole,
      country: geo.country,
      department: geo.department,
      commune: geo.commune,
      city: geo.city,
    };

    if (selectedRole === 'PROVIDER') {
      payload.singleName = singleName || user?.firstName || 'Professionnel';
      payload.serviceOffered = serviceOffered || 'Services Généraux';
      payload.phoneNumber = phone;
      payload.whatsappNumber = phone;
    }

    try {
      const data = await supabaseBackend.chooseRole(targetUserId, payload);
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
            className={`cursor-pointer rounded-2xl p-4 border transition-all ${
              selectedRole === 'CLIENT'
                ? 'border-brand-600 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              {selectedRole === 'CLIENT' && (
                <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-900">Espace Client</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Pour trouver et contacter rapidement des artisans et prestataires qualifiés.
            </p>
          </div>

          {/* Option Prestataire */}
          <div
            onClick={() => setSelectedRole('PROVIDER')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all ${
              selectedRole === 'PROVIDER'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              {selectedRole === 'PROVIDER' && (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-900">Prestataire Pro</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Pour proposer vos compétences, recevoir des appels et des opportunités.
            </p>
          </div>
        </div>

        {/* 2. LOCALISATION EN CASCADE */}
        {selectedRole && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Votre Localisation
            </h4>
            <GeoCascadeSelect
              initialValues={{
                country: geo.country,
                countryCode: geo.countryCode,
                department: geo.department,
                commune: geo.commune,
                city: geo.city,
              }}
              onChange={setGeo}
              required={true}
              compact={true}
            />

            {selectedRole === 'PROVIDER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nom commercial ou Prénom
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    placeholder="Ex: Kouamé Élec"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Métier / Spécialité
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    placeholder="Ex: Électricien, Plombier..."
                    value={serviceOffered}
                    onChange={(e) => setServiceOffered(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
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
