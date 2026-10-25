import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  country?: string;
  onCountryChange?: (c: string) => void;
  language?: string;
  onLanguageChange?: (l: string) => void;
  user: any;
  onLogout: () => void;
  onGoHome?: () => void;
  onNavigateAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  isAuthPage?: boolean;
  onToggleMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onGoHome,
  isAuthPage = false,
  onToggleMenu,
}) => {
  // 1. SUR LA PAGE DE CONNEXION : LOGO SEUL, SUPPRESSION TOTALE DE TOUS LES BOUTONS EN HAUT
  if (isAuthPage || !user) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={onGoHome}
            className={`flex items-center gap-2.5 ${onGoHome ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                SERVICE <span className="text-brand-600">RAPIDE</span>
              </h1>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Panafrique
              </p>
            </div>
          </div>
          {/* Aucun bouton en haut sur la page de connexion */}
        </div>
      </header>
    );
  }

  // 2. DANS L'APPLICATION (UTILISATEUR CONNECTÉ) :
  // Affichage du menu trois traits (☰) à gauche et logo officiel.
  // Suppression de tout sélecteur de pays européen ou langue européenne.
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* BOUTON MENU LATÉRAL TROIS TRAITS (☰) */}
          <button
            type="button"
            onClick={onToggleMenu}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center transition border border-slate-200 shadow-2xs"
            title="Menu de navigation principal"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo officiel de l'application */}
          <div
            onClick={onGoHome}
            className={`flex items-center gap-2.5 ${onGoHome ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                SERVICE <span className="text-brand-600">RAPIDE</span>
              </h1>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Panafrique
              </p>
            </div>
          </div>
        </div>

        {/* Côté droit épuré avec badge de rôle connecté */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 hidden sm:inline-block">
            {user?.firstName ? `Bonjour, ${user.firstName}` : user?.email}
          </span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || user?.role === 'developer'
              ? '🛡️ Superviseur'
              : user?.role === 'PROVIDER'
              ? '🛠️ Prestataire'
              : '👤 Client'}
          </span>
        </div>
      </div>
    </header>
  );
};
