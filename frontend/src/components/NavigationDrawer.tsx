import React, { useEffect, useState } from 'react';
import { useIsPwaInstalled } from '../utils/pwaUtils';
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
  Download,
  Clock,
  ChevronRight,
  Sparkles,
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

/* ─── MODERN NAV BUTTON COMPONENT ─── */
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
  accentColor?: string;
  bgAccent?: string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  subtitle,
  isActive,
  onClick,
  accentColor = 'text-brand-600',
  bgAccent = 'bg-brand-50',
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      group w-full flex items-center gap-3.5 sm:gap-4 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl
      transition-all duration-200 ease-out
      outline-none focus-visible:ring-2 focus-visible:ring-brand-500
      active:scale-[0.98] select-none text-left
      border
      ${
        isActive
          ? 'bg-gradient-to-r from-brand-50 via-emerald-50/70 to-white border-brand-300 text-brand-950 shadow-xs ring-1 ring-brand-300/60'
          : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-800 hover:shadow-xs'
      }
    `}
  >
    {/* Conteneur d'icône agrandi et dynamique */}
    <span
      className={`
        flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0
        transition-all duration-200
        ${
          isActive
            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 scale-105 ring-2 ring-brand-300/40'
            : `${bgAccent} ${accentColor} border border-slate-200/50 group-hover:scale-105 group-hover:shadow-xs`
        }
      `}
    >
      {icon}
    </span>

    {/* Textes : Titre agrandi + sous-titre explicatif moderne */}
    <div className="flex-1 min-w-0 pr-1">
      <div className="flex items-center gap-1.5">
        <span
          className={`
            block text-[15px] sm:text-base leading-tight truncate
            ${isActive ? 'font-black text-brand-950' : 'font-extrabold text-slate-800 group-hover:text-brand-700'}
          `}
        >
          {label}
        </span>
      </div>
      <span
        className={`
          block text-[11px] sm:text-xs leading-tight truncate mt-0.5
          ${isActive ? 'text-brand-700 font-semibold' : 'text-slate-500 font-medium group-hover:text-slate-600'}
        `}
      >
        {subtitle}
      </span>
    </div>

    {/* Indicateur visuel d'état actif ou chevron au survol */}
    <div className="shrink-0 flex items-center justify-center pl-1">
      {isActive ? (
        <span className="flex items-center gap-1 text-[11px] font-black uppercase text-brand-700 bg-brand-100/80 px-2 py-0.5 rounded-full border border-brand-200">
          <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
          <span className="hidden sm:inline">Actif</span>
        </span>
      ) : (
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all duration-200" />
      )}
    </div>
  </button>
);

/* ─── MAIN NAVIGATION DRAWER ─── */
export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  user,
  currentSection,
  onSelectSection,
  onLogout,
  onOpenInstallModal,
}) => {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const isAppInstalled = useIsPwaInstalled();

  // Animation fluide d'ouverture et de fermeture
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  const role = user?.role || 'CLIENT';
  const isDev = role === 'ADMIN' || role === 'DEVELOPER' || role === 'developer';
  const isProvider = role === 'PROVIDER';
  const defaultKey = isDev ? 'USERS' : 'PROVIDERS';

  const handleItemClick = (sectionKey: string) => {
    onSelectSection(sectionKey);
    onClose();
  };

  /* ── Rubriques Client ── */
  const clientItems = [
    {
      key: 'PROVIDERS',
      icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Prestataires Disponibles',
      subtitle: 'Artisans & services qualifiés en direct',
      accent: 'text-brand-600',
      bgAccent: 'bg-brand-50',
    },
    {
      key: 'PROFILE',
      icon: <User className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Mon Profil & Abonnement',
      subtitle: 'Informations personnelles et compte',
      accent: 'text-emerald-600',
      bgAccent: 'bg-emerald-50',
    },
    {
      key: 'BOOKINGS',
      icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Mes Réservations',
      subtitle: 'Historique et suivi de vos demandes',
      accent: 'text-indigo-600',
      bgAccent: 'bg-indigo-50',
    },
    {
      key: 'FEED',
      icon: <Rss className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: "Fil d'Actualité",
      subtitle: 'Réalisations, conseils & astuces',
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
    },
    {
      key: 'ADS',
      icon: <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Faire une Publicité',
      subtitle: 'Diffuser une annonce panafricaine',
      accent: 'text-amber-500',
      bgAccent: 'bg-amber-50',
    },
    {
      key: 'SUPPORT',
      icon: <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Support Client 24/7',
      subtitle: 'Assistance, réclamations et aide',
      accent: 'text-slate-600',
      bgAccent: 'bg-slate-100',
    },
  ];

  /* ── Rubriques Prestataire ── */
  const providerItems = [
    {
      key: 'PROVIDERS',
      icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Prestataires Disponibles',
      subtitle: 'Réseau confrères et partenaires',
      accent: 'text-brand-600',
      bgAccent: 'bg-brand-50',
    },
    {
      key: 'MISSIONS',
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Demandes de Missions',
      subtitle: 'Urgences et interventions directes',
      accent: 'text-amber-600',
      bgAccent: 'bg-amber-50',
    },
    {
      key: 'PROFILE',
      icon: <User className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Mon Entreprise & Profil',
      subtitle: 'Tarifs, métier, photos et portfolio',
      accent: 'text-emerald-600',
      bgAccent: 'bg-emerald-50',
    },
    {
      key: 'FEED',
      icon: <Rss className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Mes Réalisations & Fil',
      subtitle: 'Publier vos chantiers et conseils',
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
    },
    {
      key: 'ADS',
      icon: <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Publicités Panafricaines',
      subtitle: 'Bannières et campagnes sponsorisées',
      accent: 'text-amber-500',
      bgAccent: 'bg-amber-50',
    },
    {
      key: 'BILLING',
      icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Abonnement & Facturation',
      subtitle: 'Gestion de votre forfait mensuel',
      accent: 'text-emerald-600',
      bgAccent: 'bg-emerald-50',
    },
    {
      key: 'SUPPORT',
      icon: <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Support Prestataire 24/7',
      subtitle: 'Assistance technique et financière',
      accent: 'text-slate-600',
      bgAccent: 'bg-slate-100',
    },
  ];

  /* ── Rubriques Administrateur / Développeur ── */
  const devItems = [
    {
      key: 'USERS',
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Gestion des Utilisateurs',
      subtitle: 'Comptes clients et prestataires',
      accent: 'text-brand-600',
      bgAccent: 'bg-brand-50',
    },
    {
      key: 'ACTIVITIES',
      icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: "Journal d'Audit & Activités",
      subtitle: 'Traçabilité et opérations en direct',
      accent: 'text-emerald-600',
      bgAccent: 'bg-emerald-50',
    },
    {
      key: 'ERRORS',
      icon: <Bug className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Suivi des Incidents',
      subtitle: 'Erreurs système et diagnostics',
      accent: 'text-rose-600',
      bgAccent: 'bg-rose-50',
    },
    {
      key: 'SUBSCRIPTIONS',
      icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Gestion des Abonnements',
      subtitle: 'Validation et renouvellements SasPay',
      accent: 'text-amber-600',
      bgAccent: 'bg-amber-50',
    },
    {
      key: 'ADS',
      icon: <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Gestion des Publicités',
      subtitle: 'Modération des campagnes régionales',
      accent: 'text-purple-600',
      bgAccent: 'bg-purple-50',
    },
    {
      key: 'METRICS',
      icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Supervision & Flux',
      subtitle: 'Métriques globales et trafic',
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
    },
  ];

  const navItems = isDev ? devItems : isProvider ? providerItems : clientItems;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Fond semi-transparent avec flou doux */}
      <div
        className={`fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panneau latéral rétractable */}
      <div
        className={`relative w-[88vw] max-w-[340px] sm:max-w-[380px] bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          animateIn ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── EN-TÊTE DU MENU ── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight">
                SERVICE <span className="text-brand-600">RAPIDE</span>
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Menu de Navigation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-200/80 hover:bg-slate-300 active:bg-slate-400 text-slate-700 flex items-center justify-center transition-all duration-150 active:scale-95 shadow-2xs"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CARTE IDENTITÉ UTILISATEUR ── */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            {user?.avatarUrl || user?.providerProfile?.photoUrl ? (
              <img
                src={user.avatarUrl || user.providerProfile?.photoUrl}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl border-2 border-brand-300 object-cover shrink-0 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-100 border-2 border-brand-300 text-brand-700 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold text-slate-900 truncate leading-snug">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </p>
              <p className="text-xs text-slate-500 font-medium truncate">
                {user?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {isDev ? '🛡️ Superviseur' : isProvider ? '🛠️ Prestataire Pro' : '👤 Compte Client'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ZONE DE NAVIGATION (RÉPARTITION HARMONIEUSE SUR LA HAUTEUR) ── */}
        <nav className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-3 sm:py-4 flex flex-col justify-between">
          <div className="flex flex-col justify-around flex-1 gap-2.5 sm:gap-3 py-1">
            {navItems.map((item, index) => {
              const isItemActive = currentSection === item.key || (!currentSection && item.key === defaultKey);
              return (
                <div
                  key={item.key}
                  style={{ animationDelay: `${index * 35}ms` }}
                  className={`${animateIn ? 'animate-slideInNav' : 'opacity-0'}`}
                >
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    subtitle={item.subtitle}
                    isActive={isItemActive}
                    onClick={() => handleItemClick(item.key)}
                    accentColor={item.accent}
                    bgAccent={item.bgAccent}
                  />
                </div>
              );
            })}
          </div>

          {/* Remplissage fluide et élastique pour équilibrer la hauteur */}
          <div className="flex-1 min-h-[8px] max-h-8" />
        </nav>

        {/* ── BOUTON INSTALLATION APPLICATION (SI NON INSTALLÉE) ── */}
        {!isAppInstalled && (
          <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInstallModal?.();
              }}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-600 via-brand-700 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 active:scale-[0.98] text-white font-extrabold px-4 py-3.5 rounded-2xl text-[14px] sm:text-base transition-all duration-200 shadow-md shadow-brand-500/25"
            >
              <Download className="w-5 h-5 text-white" />
              <span>Télécharger l'application</span>
            </button>
          </div>
        )}

        {/* ── BOUTON DÉCONNEXION (TOUJOURS EN BAS DU MENU) ── */}
        <div className="px-4 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full inline-flex items-center justify-center gap-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 active:scale-[0.98] text-rose-700 font-extrabold px-4 py-3.5 rounded-2xl text-[14px] sm:text-base transition-all duration-150 border border-rose-200/80 shadow-xs"
          >
            <LogOut className="w-5 h-5 text-rose-600" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Animation d'apparition fluide des éléments */}
      <style>{`
        @keyframes slideInNav {
          0% {
            opacity: 0;
            transform: translateX(-14px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInNav {
          animation: slideInNav 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
