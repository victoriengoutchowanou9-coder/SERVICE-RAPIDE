import React from 'react';
import { Globe, Flag } from 'lucide-react';
import { AFRICAN_COUNTRIES, LANGUAGES } from '../types';

interface HeaderProps {
  country: string;
  onCountryChange: (c: string) => void;
  language: string;
  onLanguageChange: (l: string) => void;
  user: any;
  onLogout: () => void;
  onGoHome?: () => void;
  onNavigateAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
}

export const Header: React.FC<HeaderProps> = ({
  country,
  onCountryChange,
  language,
  onLanguageChange,
  user,
  onLogout,
  onGoHome,
  onNavigateAuth,
}) => {
  const currentCountryObj = AFRICAN_COUNTRIES.find((c) => c.code === country) || AFRICAN_COUNTRIES[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo de l'application */}
        <div
          onClick={onGoHome}
          className={`flex items-center gap-2 ${onGoHome ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
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

        {/* 1. SECTION DE CHOIX DE LA LANGUE ET DU PAYS */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Sélecteur Pays d'Afrique */}
          <div className="relative flex items-center">
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="appearance-none bg-slate-100 hover:bg-slate-200/80 transition text-slate-800 text-xs font-semibold py-1.5 pl-2 pr-6 rounded-lg cursor-pointer border-0 focus:ring-2 focus:ring-brand-500"
              title="Choisir le pays"
            >
              {AFRICAN_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.nameFr} ({c.currency})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 text-slate-400 text-[10px]">▼</span>
          </div>

          {/* Sélecteur Langue */}
          <div className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="appearance-none bg-slate-100 hover:bg-slate-200/80 transition text-slate-800 text-xs font-semibold py-1.5 pl-2 pr-6 rounded-lg cursor-pointer border-0 focus:ring-2 focus:ring-brand-500"
              title="Choisir la langue"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 text-slate-400 text-[10px]">▼</span>
          </div>

          {/* Liens internes Connexion / S'inscrire */}
          {!user && onNavigateAuth && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onNavigateAuth('LOGIN')}
                className="inline-flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Connexion
              </button>
              <button
                onClick={() => onNavigateAuth('REGISTER')}
                className="inline-flex items-center justify-center h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-black bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-xs transition-all"
              >
                S'inscrire
              </button>
            </div>
          )}

          {/* Bouton Déconnexion très visible */}
          {user && (
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center h-9 sm:h-10 px-3 sm:px-3.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl transition text-xs sm:text-sm font-bold shadow-xs"
              title="Se déconnecter"
            >
              <span>Se déconnecter</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
