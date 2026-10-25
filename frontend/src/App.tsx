import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientView } from './components/ClientView';
import { AdminDashboard } from './components/AdminDashboard';
import { PostItem, ProviderItem, ServiceRequest } from './types';
import { supabase, supabaseBackend } from './config/supabase';

export function App() {
  const [country, setCountry] = useState('CI');
  const [language, setLanguage] = useState('fr');
  const [viewMode, setViewMode] = useState<'LANDING' | 'APP'>('LANDING'); // Par défaut : Site Web Vitrine
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [authData, setAuthData] = useState<any>(null);
  const [paymentAlert, setPaymentAlert] = useState<string | null>(null);

  // Navigation interne sans rechargement
  const navigateTo = (path: string, mode: 'LOGIN' | 'REGISTER' = 'REGISTER') => {
    setAuthInitialMode(mode);
    if (path === '/' || path === '/landing') {
      setViewMode('LANDING');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/');
      }
    } else {
      setViewMode('APP');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', path);
      }
    }
  };

  // Synchronisation avec l'URL au chargement et retours SasPay
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search;

      if (search.includes('payment=success') || search.includes('payment_status=success')) {
        setPaymentAlert('🎉 Paiement Mobile Money validé avec succès via SasPay ! Votre accès est immédiatement actif.');
        // Rechargement immédiat des droits frais depuis la base de données
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
        setViewMode('APP');
        setAuthInitialMode('REGISTER');
      } else if (pathname === '/connexion' || pathname === '/login') {
        setViewMode('APP');
        setAuthInitialMode('LOGIN');
      } else if (pathname === '/app') {
        setViewMode('APP');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Fil des publications partagé entre prestataires et clients
  const [posts, setPosts] = useState<PostItem[]>([]);

  // Prestataires disponibles
  const [providers, setProviders] = useState<ProviderItem[]>([]);

  // Demandes de services partagées (Maintenant + Programmer)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // Écoute automatique des liens de confirmation d'email et sessions actives Supabase
  useEffect(() => {
    // 1. Écoute les événements d'authentification (ex: clic sur le lien de confirmation reçu par email)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const fullAuthData = await supabaseBackend.buildSessionUser(session);
        if (fullAuthData) {
          setAuthData(fullAuthData);
          setViewMode('APP'); // Ouvre directement l'application !
          // Nettoie l'URL des tokens pour une adresse propre
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthData(null);
      }
    });

    // 2. Vérifie si une session est déjà enregistrée dans le navigateur
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const fullAuthData = await supabaseBackend.buildSessionUser(session);
        if (fullAuthData) {
          setAuthData(fullAuthData);
        }
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
      city: newPostData.city || 'Abidjan',
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
      clientPhone: newReq.clientPhone || '+22507000000',
      clientAvatar: newReq.clientAvatar || user?.avatarUrl,
      providerId: newReq.providerId || 'prov-1',
      providerSingleName: newReq.providerSingleName || 'Prestataire',
      serviceTitle: newReq.serviceTitle || 'Service',
      description: newReq.description || '',
      mode: newReq.mode || 'IMMEDIATE',
      scheduledDateTime: newReq.scheduledDateTime,
      location: newReq.location || 'Abidjan',
      estimatedPrice: newReq.estimatedPrice || 10000,
      status: 'PENDING',
      paymentMethod: newReq.paymentMethod || 'ORANGE_MONEY',
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignorer si déjà déconnecté
    }
    setAuthData(null);
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
      <Header
        country={country}
        onCountryChange={setCountry}
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onLogout={handleLogout}
        onGoHome={() => navigateTo('/', 'REGISTER')}
        onNavigateAuth={(mode) => navigateTo(mode === 'LOGIN' ? '/connexion' : '/inscription', mode)}
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
        {/* SITE WEB VITRINE COMPLET */}
        {viewMode === 'LANDING' ? (
          <LandingPage
            onStart={() => {
              handleLogout();
              navigateTo('/inscription', 'REGISTER');
            }}
          />
        ) : (
          /* APPLICATION WEB COMPLETE */
          <>
            {!user && (
              <AuthView
                country={country}
                language={language}
                initialMode={authInitialMode}
                onNavigate={(mode) => navigateTo(mode === 'LOGIN' ? '/connexion' : '/inscription', mode)}
                onSuccess={(data) => {
                  handleAuthSuccess(data);
                  setViewMode('APP');
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/app');
                  }
                }}
              />
            )}

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
              />
            )}

            {user && (user.role === 'ADMIN' || user.role === 'DEVELOPER' || user.role === 'developer') && (
              <AdminDashboard token={token} />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold">
          SERVICE RAPIDE © 2026 • Plateforme Panafricaine de Services de Confiance
        </p>
      </footer>
    </div>
  );
}
export default App;
