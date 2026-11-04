import { useState, useEffect } from 'react';

/**
 * Vérifie si l'application est déjà installée sur l'appareil (PWA standalone, TWA ou enregistrée).
 */
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Détection PWA standalone (Android Chrome / Edge / Windows / Mac)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;

  // 2. Détection iOS standalone (Safari "Ajouter sur l'écran d'accueil")
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // 3. Détection Android TWA (Trusted Web Activity)
  const isTWA = typeof document !== 'undefined' && Boolean(document.referrer?.includes('android-app://'));

  // 4. Détection persistée dans localStorage lors d'une installation confirmée
  const isSavedInstalled = typeof localStorage !== 'undefined' && localStorage.getItem('sr_pwa_installed') === 'true';

  return Boolean(isStandalone || isIOSStandalone || isTWA || isSavedInstalled);
}

/**
 * Hook React retournant si l'application est actuellement installée.
 * Se met à jour en temps réel lors de l'installation.
 */
export function useIsPwaInstalled(): boolean {
  const [installed, setInstalled] = useState<boolean>(() => isPwaInstalled());

  useEffect(() => {
    // Vérification initiale
    if (isPwaInstalled()) {
      setInstalled(true);
    }

    // Écoute de l'événement de changement de mode d'affichage
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        try { localStorage.setItem('sr_pwa_installed', 'true'); } catch {}
        setInstalled(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Écoute de l'événement natif d'installation PWA déclenché par Chrome/Android
    const handleAppInstalled = () => {
      try { localStorage.setItem('sr_pwa_installed', 'true'); } catch {}
      setInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return installed;
}
