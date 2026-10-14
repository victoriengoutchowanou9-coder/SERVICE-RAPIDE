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
  const [posts, setPosts] = useState<PostItem[]>([
    {
      id: 'post-1',
      authorId: 'prov-1',
      authorSingleName: 'Mamadou',
      authorPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      authorService: 'Climatisation & Froid',
      city: 'Abidjan',
      department: 'Cocody Riviera 2',
      mapLocationHint: 'À 1.8 km de votre zone',
      content: 'Chantier terminé ce matin à Cocody Angré : maintenance complète de 4 splits inverter. Pensez à nettoyer vos filtres avant la saison des pluies !',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      likesCount: 14,
      createdAt: 'Il y a 30 min',
    },
    {
      id: 'post-2',
      authorId: 'prov-2',
      authorSingleName: 'Koffi',
      authorPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      authorService: 'Électricien Bâtiment',
      city: 'Cotonou',
      department: 'Littoral (Cadjehoun)',
      mapLocationHint: 'Zone Cadjehoun • Sur place',
      content: 'Raccordement de tableau électrique aux normes pour une villa à Cadjehoun. Diagnostic et devis rapide sur place.',
      likesCount: 9,
      createdAt: 'Il y a 2 heures',
    },
  ]);

  // Prestataires disponibles avec toutes les caractéristiques
  const [providers, setProviders] = useState<ProviderItem[]>([
    {
      id: 'prov-1',
      singleName: 'Mamadou',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Climatisation & Froid',
      skills: ['Split Inverter', 'Recharge Gaz R410', 'Chambre froide', 'Dépannage d’urgence'],
      city: 'Abidjan',
      department: 'Cocody',
      interventionZones: ['Cocody', 'Plateau', 'Riviera', 'Marcory', 'Bingerville'],
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: true,
      travelRequired: true,
      travelFee: 2500,
      basePrice: 15000,
      pricingUnit: 'par climatiseur',
      rating: 4.9,
      reviewsCount: 38,
      completedMissions: 84,
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '+225 07 89 45 12 00', whatsappNumber: '+2250789451200' },
      reviews: [
        {
          id: 'rev-1',
          clientName: 'Awa K.',
          rating: 5,
          comment: 'Climatiseur réparé en 30 minutes à Cocody Angré. Très professionnel !',
          date: 'Il y a 2 jours',
        },
        {
          id: 'rev-2',
          clientName: 'Jean-Marc D.',
          rating: 5,
          comment: 'Très sérieux, devis respecté et matériel très propre.',
          date: 'Il y a 1 semaine',
        },
      ],
    },
    {
      id: 'prov-2',
      singleName: 'Koffi',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Électricien Bâtiment & Industriel',
      skills: ['Tableaux électriques', 'Court-circuit', 'Groupe électrogène', 'Domotique'],
      city: 'Cotonou',
      department: 'Littoral',
      interventionZones: ['Cadjehoun', 'Haie Vive', 'Akpakpa', 'Fidjrossè'],
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: false,
      travelRequired: true,
      travelFee: 2000,
      basePrice: 8000,
      pricingUnit: 'par intervention',
      rating: 4.8,
      reviewsCount: 24,
      completedMissions: 59,
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '+229 97 12 34 56', whatsappNumber: '+22997123456' },
    },
    {
      id: 'prov-3',
      singleName: 'Fatou',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Coiffure & Esthétique Afro',
      skills: ['Tresses africaines', 'Nattes collées', 'Locks', 'Maquillage événementiel'],
      city: 'Dakar',
      department: 'Almadies',
      interventionZones: ['Almadies', 'Ngor', 'Ouakam', 'Plateau', 'Mermoz'],
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: true,
      travelRequired: false,
      travelFee: 0,
      basePrice: 6000,
      pricingUnit: 'par coiffure',
      rating: 5.0,
      reviewsCount: 42,
      completedMissions: 110,
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '+221 77 123 45 67', whatsappNumber: '+221771234567' },
    },
    {
      id: 'prov-4',
      singleName: 'Bakary',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Mécanique Auto & Dépannage Routier',
      skills: ['Diagnostic valise', 'Freinage', 'Embrayage', 'Remorquage rapide'],
      city: 'Bamako',
      department: 'Commune IV',
      interventionZones: ['Hamdallaye', 'ACI 2000', 'Badalabougou', 'Faladié'],
      availability: 'BUSY',
      isOnline: false,
      receivesOnSite: true,
      travelRequired: true,
      travelFee: 4000,
      basePrice: 12000,
      pricingUnit: 'par diagnostic',
      rating: 4.7,
      reviewsCount: 19,
      completedMissions: 46,
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '+223 70 12 34 56', whatsappNumber: '+22370123456' },
    },
    {
      id: 'prov-5',
      singleName: 'Jean',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      serviceOffered: 'Plombier Sanitaire Expert',
      skills: ['Recherche de fuite', 'Chauffe-eau', 'Débouchage express', 'Canalisations'],
      city: 'Douala',
      department: 'Bonapriso',
      interventionZones: ['Bonapriso', 'Akwa', 'Bonanjo', 'Bali'],
      availability: 'AVAILABLE',
      isOnline: true,
      receivesOnSite: false,
      travelRequired: true,
      travelFee: 3000,
      basePrice: 10000,
      pricingUnit: 'par intervention',
      rating: 4.9,
      reviewsCount: 31,
      completedMissions: 72,
      isContactUnlocked: false,
      unlockId: null,
      refundStatus: null,
      contact: { directPhone: '+237 690 12 34 56', whatsappNumber: '+237690123456' },
    },
  ]);

  // Demandes de services partagées (Maintenant + Programmer)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([
    {
      id: 'req-1',
      clientId: 'client-1',
      clientName: 'Awa Kouassi',
      clientPhone: '+225 07 48 12 34 56',
      clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      providerId: 'prov-1',
      providerSingleName: 'Mamadou',
      serviceTitle: 'Climatisation & Froid',
      description: 'Panne split salon : ne souffle plus d’air frais depuis ce matin. Urgent.',
      mode: 'IMMEDIATE',
      scheduledDateTime: 'Intervention Immédiate (Moins de 45 min)',
      location: 'Abidjan (Cocody Angré 8ème tranche)',
      estimatedPrice: 17500,
      status: 'PENDING',
      paymentMethod: 'ORANGE_MONEY',
      createdAt: 'Il y a 10 min',
      hasBeenRated: false,
    },
    {
      id: 'req-2',
      clientId: 'client-1',
      clientName: 'Awa Kouassi',
      clientPhone: '+225 07 48 12 34 56',
      clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      providerId: 'prov-1',
      providerSingleName: 'Mamadou',
      serviceTitle: 'Entretien Climatiseur',
      description: 'Maintenance préventive complète de 2 splits avant la saison chaude.',
      mode: 'SCHEDULED',
      scheduledDateTime: 'Demain à 10h00',
      location: 'Abidjan (Plateau Rue du Commerce)',
      estimatedPrice: 20000,
      status: 'ACCEPTED',
      paymentMethod: 'WAVE',
      createdAt: 'Il y a 2 heures',
      hasBeenRated: false,
    },
  ]);

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
                accessToken: 'demo_token_client',
                user: {
                  id: 'client-1',
                  firstName: 'Awa',
                  lastName: 'Kouassi',
                  email: 'awa.client@afrique.com',
                  avatarUrl:
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  city: 'Abidjan (Cocody)',
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
                accessToken: 'demo_token_prov',
                user: {
                  id: 'prov-user-1',
                  email: 'moussa@service.com',
                  role: 'PROVIDER',
                  providerProfile: providers.find((p) => p.id === 'prov-1') || {
                    id: 'prov-1',
                    singleName: 'Mamadou',
                    fullName: 'Mamadou Traoré',
                    photoUrl:
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                    serviceOffered: 'Climatisation & Froid',
                    skills: ['Split Inverter', 'Recharge Gaz R410', 'Chambre froide', 'Dépannage d’urgence'],
                    city: 'Abidjan',
                    department: 'Cocody Riviera',
                    interventionZones: ['Cocody', 'Plateau', 'Riviera', 'Marcory'],
                    availability: 'AVAILABLE',
                    receivesOnSite: true,
                    travelRequired: true,
                    travelFee: 2500,
                    basePrice: 15000,
                    pricingUnit: 'par prestation',
                    rating: 4.9,
                    reviewsCount: 38,
                    completedMissions: 84,
                    whatsappNumber: '+2250701020304',
                    directPhoneNumber: '+2250701020304',
                    subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
                  },
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
                accessToken: 'demo_token_admin',
                user: {
                  id: 'admin-1',
                  email: 'direction@servicerapide.africa',
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
