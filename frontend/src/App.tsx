import React, { useState } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientView } from './components/ClientView';
import { AdminDashboard } from './components/AdminDashboard';
import { PostItem, ProviderItem, ServiceRequest } from './types';

export function App() {
  const [country, setCountry] = useState('CI');
  const [language, setLanguage] = useState('fr');
  const [viewMode, setViewMode] = useState<'LANDING' | 'APP'>('LANDING'); // Par défaut : Site Web Vitrine
  const [authData, setAuthData] = useState<any>(null);

  // Fil des publications partagé entre prestataires et clients
  const [posts, setPosts] = useState<PostItem[]>([]);

  // Prestataires disponibles
  const [providers, setProviders] = useState<ProviderItem[]>([]);

  // Demandes de services partagées (Maintenant + Programmer)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

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

  const handleLogout = () => {
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
      />

      {/* Barre de navigation rapide interactive pour basculer facilement */}
      <div className="bg-slate-900 text-white text-[11px] font-semibold py-2 px-4 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="text-slate-400">Navigation Rapide :</span>

          {/* Bouton Site Web Vitrine */}
          <button
            onClick={() => setViewMode('LANDING')}
            className={`px-3 py-1 rounded-xl transition ${
              viewMode === 'LANDING' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            🌐 Site Web Vitrine
          </button>

          {/* Bouton pour aller à l'Application / Inscription */}
          <button
            onClick={() => {
              setViewMode('APP');
              handleLogout();
            }}
            className={`px-3 py-1 rounded-xl transition ${
              viewMode === 'APP' && !user ? 'bg-brand-600 text-white font-black shadow-xs ring-2 ring-white/20' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Formulaire d'Inscription
          </button>

          <button
            onClick={() => {
              setViewMode('APP');
              handleAuthSuccess({
                accessToken: 'session_client',
                user: {
                  id: 'client-active',
                  firstName: '',
                  lastName: '',
                  email: '',
                  role: 'CLIENT',
                  clientTrialExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
                },
              });
            }}
            className={`px-3 py-1 rounded-xl transition ${
              viewMode === 'APP' && user?.role === 'CLIENT' ? 'bg-brand-600 text-white font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vue Client
          </button>

          <button
            onClick={() => {
              setViewMode('APP');
              handleAuthSuccess({
                accessToken: 'session_prov',
                user: {
                  id: 'prov-active',
                  email: '',
                  role: 'PROVIDER',
                  providerProfile: null,
                },
              });
            }}
            className={`px-3 py-1 rounded-xl transition ${
              viewMode === 'APP' && user?.role === 'PROVIDER' ? 'bg-brand-600 text-white font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vue Prestataire
          </button>

          <button
            onClick={() => {
              setViewMode('APP');
              handleAuthSuccess({
                accessToken: 'session_admin',
                user: {
                  id: 'admin-active',
                  email: 'admin@servicerapide.africa',
                  role: 'ADMIN',
                },
              });
            }}
            className={`px-3 py-1 rounded-xl transition ${
              viewMode === 'APP' && user?.role === 'ADMIN' ? 'bg-brand-600 text-white font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vue Admin
          </button>
        </div>
      </div>

      <main className="flex-1">
        {/* SITE WEB VITRINE COMPLET */}
        {viewMode === 'LANDING' ? (
          <LandingPage
            onStart={(initialRole) => {
              setViewMode('APP');
              handleLogout();
            }}
          />
        ) : (
          /* APPLICATION WEB COMPLETE */
          <>
            {!user && (
              <AuthView
                country={country}
                language={language}
                onSuccess={(data) => {
                  handleAuthSuccess(data);
                  setViewMode('APP');
                }}
              />
            )}

            {user && user.role === 'PENDING' && (
              <RoleSelectionModal
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

            {user && user.role === 'ADMIN' && (
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
