import React, { useState } from 'react';
import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientView } from './components/ClientView';
import { AdminDashboard } from './components/AdminDashboard';
import { PostItem } from './types';

export function App() {
  const [country, setCountry] = useState('CI');
  const [language, setLanguage] = useState('fr');
  // Par défaut null : affiche immédiatement le Formulaire d'inscription demandé !
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
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 flex-wrap">
          <span className="text-slate-400">Accès Direct :</span>

          {/* Bouton pour revenir au Formulaire d'inscription */}
          <button
            onClick={() => handleLogout()}
            className={`px-3 py-1 rounded-xl transition ${
              !user ? 'bg-brand-600 text-white font-black shadow-xs ring-2 ring-white/20' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Formulaire d'Inscription
          </button>

          <button
            onClick={() =>
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
              })
            }
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'CLIENT' ? 'bg-brand-600 text-white font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vue Client (Profil, Prestataires & Pubs)
          </button>

          <button
            onClick={() =>
              handleAuthSuccess({
                accessToken: 'demo_token_prov',
                user: {
                  id: 'prov-user-1',
                  email: 'moussa@service.com',
                  role: 'PROVIDER',
                  providerProfile: {
                    id: 'prov-1',
                    singleName: 'Mamadou',
                    fullName: 'Mamadou Traoré',
                    photoUrl:
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                    serviceOffered: 'Climatisation & Froid',
                    city: 'Abidjan',
                    department: 'Cocody Riviera',
                    availability: 'AVAILABLE',
                    receivesOnSite: true,
                    travelRequired: true,
                    travelFee: 2500,
                    whatsappNumber: '+2250701020304',
                    directPhoneNumber: '+2250701020304',
                    subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
                  },
                },
              })
            }
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'PROVIDER' ? 'bg-brand-600 text-white font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vue Prestataire (Photo, Publications & Clients En Ligne)
          </button>

          <button
            onClick={() =>
              handleAuthSuccess({
                accessToken: 'demo_token_admin',
                user: {
                  id: 'admin-1',
                  email: 'direction@servicerapide.africa',
                  role: 'ADMIN',
                },
              })
            }
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'ADMIN' ? 'bg-brand-600 text-white font-black shadow-xs' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Vue Admin (Remboursements Manuels)
          </button>
        </div>
      </div>

      <main className="flex-1">
        {!user && (
          <AuthView
            country={country}
            language={language}
            onSuccess={handleAuthSuccess}
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
            onAddPost={handleAddPost}
          />
        )}

        {user && user.role === 'CLIENT' && (
          <ClientView
            user={user}
            token={token}
            country={country}
            posts={posts}
            onAddPost={handleAddPost}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {user && user.role === 'ADMIN' && (
          <AdminDashboard token={token} />
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
