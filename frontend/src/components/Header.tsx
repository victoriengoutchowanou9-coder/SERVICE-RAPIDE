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

const Logo: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => (
  <div
    onClick={onGoHome}
    className={`flex items-center gap-3 ${onGoHome ? 'cursor-pointer' : ''}`}
  >
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
      style={{
        background: 'linear-gradient(135deg, #4036ae, #2b2670)',
        boxShadow: '0 6px 16px rgba(64, 54, 174, 0.3)',
      }}
    >
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div>
      <h1 className="sr-title text-lg leading-none">
        SERVICE <span style={{ color: 'var(--sr-primary)' }}>RAPIDE</span>
      </h1>
      <p
        className="text-[10px] uppercase font-semibold tracking-widest mt-1"
        style={{ color: 'var(--sr-text)' }}
      >
        Panafrique
      </p>
    </div>
  </div>
);

const roleLabel = (role?: string) => {
  if (role === 'ADMIN' || role === 'DEVELOPER' || role === 'developer') return '🛡️ Superviseur';
  if (role === 'PROVIDER') return '🛠️ Prestataire';
  return '👤 Client';
};

export const Header: React.FC<HeaderProps> = ({
  user,
  onGoHome,
  isAuthPage = false,
  onToggleMenu,
}) => {
  // Page de connexion : logo seul
  if (isAuthPage || !user) {
    return (
      <header
        className="sticky top-0 z-40 bg-white px-4 py-3"
        style={{ borderBottom: '1px solid var(--sr-border)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo onGoHome={onGoHome} />
        </div>
      </header>
    );
  }

  // Utilisateur connecté : menu + logo + badge de rôle
  return (
    <header
      className="sticky top-0 z-40 bg-white px-4 py-3"
      style={{ borderBottom: '1px solid var(--sr-border)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMenu}
            className="sr-icon-btn"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Logo onGoHome={onGoHome} />
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold hidden sm:inline-block"
            style={{ color: 'var(--sr-text)' }}
          >
            {user?.firstName ? `Bonjour, ${user.firstName}` : user?.email}
          </span>
          <span
            className="text-[11px] font-bold px-3 py-2 rounded-full uppercase tracking-wider"
            style={{
              background: 'var(--sr-lavender)',
              color: 'var(--sr-primary-dark)',
            }}
          >
            {roleLabel(user?.role)}
          </span>
        </div>
      </div>
    </header>
  );
};