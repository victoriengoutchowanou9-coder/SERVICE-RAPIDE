import React from 'react';
import {
  X,
  User,
  Briefcase,
  Calendar,
  Rss,
  Megaphone,
  CreditCard,
  LogOut,
  ShieldAlert,
  Users,
  Activity,
  Bug,
  HelpCircle,
  Sparkles,
  Download,
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentSection: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
  onOpenInstallModal?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  user,
  currentSection,
  onSelectSection,
  onLogout,
  onOpenInstallModal,
}) => {
  if (!isOpen) return null;

  const role = user?.role || 'CLIENT';
  const isDev = role === 'ADMIN' || role === 'DEVELOPER' || role === 'developer';
  const isProvider = role === 'PROVIDER';
  const isClient = role === 'CLIENT';

  const handleItemClick = (sectionKey: string) => {
    onSelectSection(sectionKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Arrière-plan semi-transparent cliquable pour fermer */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Tiroir de navigation latéral vertical à gauche */}
      <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 border-r border-slate-200">
        {/* En-tête du menu */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-none">
                SERVICE <span className="text-brand-600">RAPIDE</span>
              </h3>
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">
                Menu Principal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm transition"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Identité utilisateur */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {user?.email}
              </p>
              <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isDev ? '🛡️ Superviseur' : isProvider ? '🛠️ Prestataire Pro' : '👤 Compte Client'}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des boutons de navigation verticaux alignés */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* RUBRIQUES POUR CLIENT */}
          {isClient && (
            <>
              <button
                type="button"
                onClick={() => handleItemClick('PROVIDERS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'PROVIDERS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span>Prestataires Disponibles</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('PROFILE')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'PROFILE'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Mon Profil & Abonnement</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('BOOKINGS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'BOOKINGS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Mes Réservations</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('FEED')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'FEED'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Rss className="w-4 h-4 text-blue-600" />
                <span>Fil d'Actualité</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('ADS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'ADS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Faire une Publicité</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('SUPPORT')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'SUPPORT'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <span>Support Client 24/7</span>
              </button>
            </>
          )}

          {/* RUBRIQUES POUR PRESTATAIRE */}
          {isProvider && (
            <>
              <button
                type="button"
                onClick={() => handleItemClick('MISSIONS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'MISSIONS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span>Demandes de Missions</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('PROFILE')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'PROFILE'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Mon Entreprise & Profil</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('FEED')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'FEED'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Rss className="w-4 h-4 text-blue-600" />
                <span>Mes Réalisations & Fil</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('ADS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'ADS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Publicités Panafricaines</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('BILLING')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'BILLING'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Abonnement & Facturation</span>
              </button>
            </>
          )}

          {/* RUBRIQUES POUR SUPERVISEUR / DÉVELOPPEUR */}
          {isDev && (
            <>
              <button
                type="button"
                onClick={() => handleItemClick('USERS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'USERS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-brand-600" />
                <span>Gestion des Utilisateurs</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('ACTIVITIES')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'ACTIVITIES'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Journal d'Audit & Activités</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('ERRORS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'ERRORS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bug className="w-4 h-4 text-rose-600" />
                <span>Suivi des Erreurs & Incidents</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('SUBSCRIPTIONS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'SUBSCRIPTIONS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Gestion des Abonnements</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('ADS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'ADS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-purple-600" />
                <span>Gestion des Publicités</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('METRICS')}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  currentSection === 'METRICS'
                    ? 'bg-brand-50 text-brand-700 font-black shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Supervision & Flux</span>
              </button>
            </>
          )}
        </div>

        {/* Téléchargement / Installation de l'application */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInstallModal?.();
            }}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 active:scale-[0.99] text-white font-black px-3.5 py-2.5 rounded-2xl text-xs transition shadow-md shadow-brand-500/20"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Télécharger l'application</span>
          </button>
        </div>

        {/* Pied du menu : Bouton Déconnexion vertical */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full inline-flex items-center gap-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold px-3.5 py-2.5 rounded-2xl text-xs transition border border-rose-200 shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
