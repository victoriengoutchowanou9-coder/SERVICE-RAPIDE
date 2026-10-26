import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Monitor,
  Laptop,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState<'ANDROID' | 'IOS' | 'PC'>('ANDROID');

  useEffect(() => {
    // Détection si l'application fonctionne déjà en mode PWA autonome
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Détection iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);
    if (isIosDevice) {
      setActiveTab('IOS');
    } else if (/android/.test(userAgent)) {
      setActiveTab('ANDROID');
    } else {
      setActiveTab('PC');
    }

    // Écoute de l'événement natif d'installation PWA (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Événement après installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleNativeInstall = async () => {
    const prompt = deferredPrompt || (window as any).__pwaPrompt;
    if (prompt) {
      prompt.prompt();
      const choiceResult = await prompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Si le prompt natif n'est pas encore prêt, on affiche les instructions spécifiques
      if (isIOS) {
        setActiveTab('IOS');
      } else {
        setActiveTab('ANDROID');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* En-tête décoratif */}
        <div className="bg-gradient-to-tr from-brand-600 to-emerald-500 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Télécharger l'Application</h3>
              <p className="text-xs text-white/90 font-medium">SERVICE RAPIDE sur votre téléphone</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-4">
          {isInstalled ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Application déjà installée !</h4>
              <p className="text-xs text-slate-600">
                SERVICE RAPIDE est déjà installé sur cet appareil et prêt à être utilisé depuis votre écran d'accueil.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              {/* Bouton d'installation direct (si supporté par le navigateur) */}
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 text-white font-black rounded-2xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <Download className="w-4 h-4" />
                  <span>Installer maintenant (1 clic)</span>
                </button>
              )}

              {/* Sélecteur de système */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('ANDROID')}
                  className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'ANDROID'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('IOS')}
                  className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'IOS'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone / iPad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PC')}
                  className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'PC'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Ordinateur</span>
                </button>
              </div>

              {/* Instructions Android */}
              {activeTab === 'ANDROID' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Ouvrez ce site dans <strong>Google Chrome</strong> sur votre téléphone Android.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Appuyez sur le menu (les <strong>3 petits points verticaux ⋮</strong> en haut à droite).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                    </p>
                  </div>
                  <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>L'application s'ouvrira en plein écran sans barre d'adresse de navigateur !</span>
                  </div>
                </div>
              )}

              {/* Instructions iPhone / iPad */}
              {activeTab === 'IOS' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      Ouvrez le site dans <strong>Safari</strong> et appuyez sur l'icône <strong>Partager</strong>{' '}
                      <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> en bas de l'écran.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      Faites défiler vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong>{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline text-slate-600" />.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      Appuyez sur <strong>« Ajouter »</strong> en haut à droite pour finaliser l'installation.
                    </p>
                  </div>
                  <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>L'icône SERVICE RAPIDE apparaît immédiatement sur votre écran d'iPhone !</span>
                  </div>
                </div>
              )}

              {/* Instructions Ordinateur */}
              {activeTab === 'PC' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Dans Chrome ou Edge, repérez l'icône <strong>« Installer l'application »</strong>{' '}
                      <Monitor className="w-3.5 h-3.5 inline text-brand-600" /> située à droite de la barre d'adresse URL.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Cliquez dessus puis confirmez en cliquant sur <strong>« Installer »</strong>.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 font-semibold hover:text-slate-800 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
