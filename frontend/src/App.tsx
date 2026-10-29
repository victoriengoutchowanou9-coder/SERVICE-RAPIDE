import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { AuthView } from './components/AuthView';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientView } from './components/ClientView';
import { AdminDashboard } from './components/AdminDashboard';
import { InstallAppModal } from './components/InstallAppModal';
import { SupportModal } from './components/SupportModal';
import { PostItem, ProviderItem, ServiceRequest } from './types';
import { supabase, supabaseBackend } from './config/supabase';

export function App() {
  const [country, setCountry] = useState('BJ');
  const [language, setLanguage] = useState('fr');

  // Par défaut, l'application s'ouvre DIRECTEMENT sur la mire de connexion
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authData, setAuthData] = useState<any>(null);
  const [paymentAlert, setPaymentAlert] = useState<string | null>(null);

  // État du menu trois traits (☰)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerSection, setActiveDrawerSection] = useState<string>('');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Navigation interne sans rechargement
  const navigateTo = (path: string, mode: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
    setAuthInitialMode(mode);
    if (typeof window !== 'undefined') {
      const targetPath = mode === 'REGISTER' || path === '/inscription' ? '/inscription' : '/connexion';
      window.history.pushState({}, '', targetPath);
    }
  };

  // 1. Restauration de session locale au premier montage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('sr_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.user) {
          setAuthData(parsed);
        }
      }
    } catch (e) {
      console.warn('Erreur lecture session locale:', e);
    }
  }, []);

  // 2. Synchronisation de la route URL et retours de paiements SasPay
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search;

      if (search.includes('payment=success') || search.includes('payment_status=success')) {
        setPaymentAlert('🎉 Paiement Mobile Money validé avec succès via SasPay ! Votre accès est immédiatement actif.');
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            const fresh = await supabaseBackend.buildSessionUser(session);
            if (fresh) setAuthData(fresh);
          }
        });
        setTimeout(() => setPaymentAlert(null), 7000);
      } else if (search.includes('payment=cancelled') || search.includes('payment_status=cancelled')) {
        setPaymentAlert('Paiement annulé. Vous pouvez relancer la transaction à tout moment.');
        setTimeout(() => setPaymentAlert(null), 5000);
      }

      if (pathname === '/inscription' || pathname === '/register') {
        setAuthInitialMode('REGISTER');
      } else {
        // Toutes les autres routes (y compris '/' ou '/connexion') ouvrent directement la connexion
        setAuthInitialMode('LOGIN');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, [authData?.user]);

  // Publications partagées
  const [posts, setPosts] = useState<PostItem[]>([]);

  // Prestataires disponibles
  const [providers, setProviders] = useState<ProviderItem[]>([]);

  // Demandes de services
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // Écoute automatique des sessions Supabase
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const fullAuthData = await supabaseBackend.buildSessionUser(session);
        if (fullAuthData) {
          setAuthData(fullAuthData);
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthData(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAddPost = (newPostData: Partial<PostItem>) => {
    const post: PostItem = {
      id: `post-${Date.now()}`,
      authorId: newPostData.authorId || 'prov-user',
      authorSingleName: newPostData.authorSingleName || 'Prestataire',
      authorPhotoUrl: newPostData.authorPhotoUrl,
      authorService: newPostData.authorService || 'Services',
      city: newPostData.city || 'Cotonou',
      content: newPostData.content || '',
      imageUrl: newPostData.imageUrl,
      likesCount: 0,
      createdAt: 'À l’instant',
    };
    setPosts([post, ...posts]);
  };

  const handleAddServiceRequest = (newReq: Partial<ServiceRequest>) => {
    const fullReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      clientId: newReq.clientId || user?.id || 'client-demo',
      clientName: newReq.clientName || 'Client',
      clientPhone: newReq.clientPhone || '',
      clientAvatar: newReq.clientAvatar || user?.avatarUrl,
      providerId: newReq.providerId || 'prov-1',
      providerSingleName: newReq.providerSingleName || 'Prestataire',
      serviceTitle: newReq.serviceTitle || 'Service',
      description: newReq.description || '',
      mode: newReq.mode || 'IMMEDIATE',
      scheduledDateTime: newReq.scheduledDateTime,
      location: newReq.location || 'Cotonou',
      estimatedPrice: newReq.estimatedPrice || 10000,
      status: 'PENDING',
      paymentMethod: newReq.paymentMethod || 'MTN_MOMO',
      createdAt: 'À l’instant',
      hasBeenRated: false,
    };
    setServiceRequests([fullReq, ...serviceRequests]);
  };

  const handleUpdateRequestStatus = (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'PAID') => {
    setServiceRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
  };

  const handleSubmitReview = (providerId: string, rating: number, comment: string) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === providerId) {
          const newCount = (p.reviewsCount || 0) + 1;
          const newScore = Number(((p.rating * (p.reviewsCount || 1) + rating) / newCount).toFixed(1));
          const newReview = {
            id: `rev-${Date.now()}`,
            clientName: `${user?.firstName || 'Client'} ${user?.lastName ? user.lastName[0] + '.' : ''}`,
            rating,
            comment,
            date: 'À l’instant',
          };
          return {
            ...p,
            rating: newScore,
            reviewsCount: newCount,
            completedMissions: (p.completedMissions || 0) + 1,
            reviews: [newReview, ...(p.reviews || [])],
          };
        }
        return p;
      })
    );
  };

  const handleUpdateProviderProfile = (updatedProfile: any) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? { ...p, ...updatedProfile } : p))
    );
  };

  const handleAuthSuccess = (data: any) => {
    setAuthData(data);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/app');
    }
  };

  const handleRoleChosen = (roleData: any) => {
    setAuthData((prev: any) => ({
      ...prev,
      user: {
        ...prev.user,
        role: roleData.role,
        providerProfile: roleData.details?.providerProfile || prev.user?.providerProfile,
      },
    }));
  };

  // Déconnexion complète
  const handleLogout = async () => {
    try {
      localStorage.removeItem('sr_session');
      localStorage.removeItem('sr_token');
      sessionStorage.clear();
      await supabase.auth.signOut();
    } catch (e) {
      // Ignorer
    }
    setAuthData(null);
    setDrawerOpen(false);
    setActiveDrawerSection('');
    navigateTo('/connexion', 'LOGIN');
  };

  const handleUpdateUser = (updatedUser: any) => {
    setAuthData((prev: any) => ({
      ...prev,
      user: updatedUser,
    }));
  };

  const user = authData?.user;
  const token = authData?.accessToken || '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* MENU TIROIR VERTICAL (☰) */}
      {user && (
        <>
          <NavigationDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            user={user}
            currentSection={activeDrawerSection}
            onSelectSection={(sec) => setActiveDrawerSection(sec)}
            onLogout={handleLogout}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
          <InstallAppModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
          />
          {activeDrawerSection === 'SUPPORT' && (
            <SupportModal onClose={() => setActiveDrawerSection('')} />
          )}
        </>
      )}

      {/* EN-TÊTE OFFICIEL DE L'APPLICATION */}
      <Header
        country={country}
        onCountryChange={setCountry}
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onLogout={handleLogout}
        onGoHome={() => {
          if (user) {
            setActiveDrawerSection('');
          } else {
            navigateTo('/connexion', 'LOGIN');
          }
        }}
        onNavigateAuth={(mode) => navigateTo(mode === 'LOGIN' ? '/connexion' : '/inscription', mode)}
        isAuthPage={!user}
        onToggleMenu={() => setDrawerOpen((prev) => !prev)}
      />

      {paymentAlert && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 text-center shadow-md animate-fadeIn flex items-center justify-center gap-2">
          <span>{paymentAlert}</span>
          <button onClick={() => setPaymentAlert(null)} className="text-white/80 hover:text-white font-black ml-2">
            ✕
          </button>
        </div>
      )}

      <main className="flex-1">
        {/* MIRE DE CONNEXION / INSCRIPTION UNIQUE DIRECTE (AUCUN SITE MARKETING) */}
        {!user && (
          <AuthView
            country={country}
            language={language}
            initialMode={authInitialMode}
            onNavigate={(mode) => navigateTo(mode === 'LOGIN' ? '/connexion' : '/inscription', mode)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* ESPACES CONNECTÉS PRIVÉS BASÉS STRICTEMENT SUR LE RÔLE */}
        {user && user.role === 'PENDING' && (
          <RoleSelectionModal
            user={user}
            token={token}
            onRoleChosen={handleRoleChosen}
          />
        )}

        {user && user.role === 'PROVIDER' && (
          <ProviderDashboard
            user={user}
            token={token}
            posts={posts}
            serviceRequests={serviceRequests}
            onAddPost={handleAddPost}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onUpdateProviderProfile={handleUpdateProviderProfile}
            onLogout={handleLogout}
            activeSectionOverride={activeDrawerSection}
          />
        )}

        {user && user.role === 'CLIENT' && (
          <ClientView
            user={user}
            token={token}
            country={country}
            posts={posts}
            providers={providers}
            serviceRequests={serviceRequests}
            onAddPost={handleAddPost}
            onUpdateUser={handleUpdateUser}
            onAddServiceRequest={handleAddServiceRequest}
            onSubmitReview={handleSubmitReview}
            onLogout={handleLogout}
            activeSectionOverride={activeDrawerSection}
          />
        )}

        {user && (user.role === 'ADMIN' || user.role === 'DEVELOPER' || user.role === 'developer') && (
          <AdminDashboard
            token={token}
            onLogout={handleLogout}
            activeTabOverride={activeDrawerSection as any}
          />
        )}
      </main>

      {/* PIED DE PAGE STRICTEMENT PROFESSIONNEL (AUCUN LIEN DÉVELOPPEUR PUBLIC NI MARKETING) */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="font-semibold text-[11px] text-slate-500">
            SERVICE RAPIDE © 2026 • Système Panafricain Sécurisé de Services et Petits Travaux
          </p>
          <p className="text-[10px] text-slate-400">
            Plateforme réservée aux utilisateurs enregistrés et professionnels agréés.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
