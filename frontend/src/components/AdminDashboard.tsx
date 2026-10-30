import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Briefcase,
  CreditCard,
  RotateCcw,
  CheckCircle,
  XCircle,
  Megaphone,
  Trash2,
  Eye,
  LogOut,
  ShieldAlert,
  Search,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  Bug,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardProps {
  token: string;
  onLogout?: () => void;
  activeTabOverride?: 'USERS' | 'ACTIVITIES' | 'ERRORS' | 'SUBSCRIPTIONS' | 'ADS' | 'METRICS';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onLogout,
  activeTabOverride,
}) => {
  const [activeTab, setActiveTab] = useState<
    'USERS' | 'ACTIVITIES' | 'ERRORS' | 'SUBSCRIPTIONS' | 'ADS' | 'METRICS'
  >(activeTabOverride || 'USERS');

  const [feedback, setFeedback] = useState<string | null>(null);

  // Synchronisation si prop externe changée
  useEffect(() => {
    if (activeTabOverride) {
      setActiveTab(activeTabOverride);
    }
  }, [activeTabOverride]);

  // A. ÉTATS RÉELS DE LA CONSOLE (SOURCE UNIQUE SUPABASE - AUCUNE FAUSSE DONNÉE)
  const [usersList, setUsersList] = useState<Array<{
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: 'CLIENT' | 'PROVIDER' | 'DEVELOPER';
    country: string;
    city: string;
    isActive: boolean;
    createdAt: string;
    subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  }>>([]);

  const [activitiesLog, setActivitiesLog] = useState<Array<{
    id: string;
    timestamp: string;
    type: string;
    accountEmail: string;
    details: string;
    module?: string;
    status?: string;
  }>>([]);

  const [errorsLog, setErrorsLog] = useState<Array<{
    id: string;
    timestamp: string;
    module: string;
    message: string;
    resolved: boolean;
  }>>([]);

  const [subscriptionsList, setSubscriptionsList] = useState<Array<{
    id: string;
    userEmail: string;
    accountType: string;
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PENDING';
    expiresAt: string;
    amountPaid: number;
    paymentRef: string;
  }>>([]);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalProviders: 0,
    totalRevenue: 0,
    totalActiveAds: 0,
    totalLogs: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const [searchUser, setSearchUser] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // CHARGEMENT RÉEL DES DONNÉES DEPUIS SUPABASE VIA L'API DE SUPERVISION
  const fetchOverview = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const adminToken = token || (typeof window !== 'undefined' ? localStorage.getItem('sr_token') : '') || 'sr_dev_session';
      const res = await fetch('/api/admin?action=overview', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setActivitiesLog(data.activities || []);
        setErrorsLog(data.errors || []);
        setSubscriptionsList(data.subscriptions || []);
        if (data.metrics) setMetrics(data.metrics);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement des données développeur:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Chargement initial + Actualisation périodique automatique toutes les 10 secondes (polling temps réel fiable)
  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => {
      fetchOverview(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  // Actions de modération réelles
  const handleToggleUserBlock = async (userId: string) => {
    try {
      const adminToken = token || (typeof window !== 'undefined' ? localStorage.getItem('sr_token') : '') || 'sr_dev_session';
      const res = await fetch('/api/admin?action=toggle-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: data.isActive } : u))
        );
        setFeedback(data.message || 'Statut du compte mis à jour avec succès.');
        setTimeout(() => setFeedback(null), 3500);
        fetchOverview(true);
      } else {
        setFeedback(data.error || 'Erreur lors de la modification du statut.');
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch {
      setFeedback('Erreur de communication avec le serveur.');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const adminToken = token || (typeof window !== 'undefined' ? localStorage.getItem('sr_token') : '') || 'sr_dev_session';
      const res = await fetch('/api/admin?action=delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setFeedback(data.message || `Compte ${userToDelete.email} supprimé avec succès.`);
        setUserToDelete(null);
        setTimeout(() => setFeedback(null), 3500);
        fetchOverview(true);
      } else {
        setFeedback(data.error || 'Erreur lors de la suppression.');
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch {
      setFeedback('Erreur de communication avec le serveur.');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleExtendSub = async (subId: string) => {
    try {
      const adminToken = token || (typeof window !== 'undefined' ? localStorage.getItem('sr_token') : '') || 'sr_dev_session';
      const res = await fetch('/api/admin?action=extend-sub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ subId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptionsList((prev) =>
          prev.map((s) => (s.id === subId ? { ...s, status: 'ACTIVE', expiresAt: data.expiresAt } : s))
        );
        setFeedback(data.message || 'Abonnement prolongé de 30 jours suite à vérification administrative.');
        setTimeout(() => setFeedback(null), 3500);
        fetchOverview(true);
      } else {
        setFeedback(data.error || 'Erreur lors de la prolongation.');
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch {
      setFeedback('Erreur de communication avec le serveur.');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = usersList.filter((u) => {
    const q = searchUser.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').includes(q) ||
      (u.city || '').toLowerCase().includes(q)
    );
  });

  const totalUsers = usersList.length;
  const activeUsersCount = usersList.filter((u) => u.isActive).length;
  const suspendedUsersCount = usersList.filter((u) => !u.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* En-tête supervision sécurisée (titre et statut) */}
      <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full">
                ● Superviseur Développeur Autorisé
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Données réelles Supabase • Maj : {lastRefreshedAt.toLocaleTimeString('fr-FR')}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight mt-0.5">
              {activeTab === 'USERS' && 'Gestion des Utilisateurs'}
              {activeTab === 'ACTIVITIES' && 'Journal d\'Audit & Activités'}
              {activeTab === 'ERRORS' && 'Suivi des Erreurs & Incidents Techniques'}
              {activeTab === 'SUBSCRIPTIONS' && 'Gestion des Abonnements & Essais Gratuits'}
              {activeTab === 'ADS' && 'Gestion & Tarification des Publicités'}
              {activeTab === 'METRICS' && 'Supervision & Flux Financiers'}
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === 'USERS' && 'Contrôle des comptes inscrits, blocage, déblocage et modération.'}
              {activeTab === 'ACTIVITIES' && 'Traçabilité des opérations de la plateforme sans données sensibles.'}
              {activeTab === 'ERRORS' && 'Surveillance des incidents techniques et échecs de paiements.'}
              {activeTab === 'SUBSCRIPTIONS' && 'Suivi des périodes gratuites et abonnements payés via SasPay.'}
              {activeTab === 'ADS' && 'Supervision des campagnes publicitaires à 1 000 FCFA / semaine.'}
              {activeTab === 'METRICS' && 'Indicateurs de conversion et volume financier global.'}
            </p>
          </div>
        </div>

        {/* Bouton d'actualisation instantanée */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => fetchOverview(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SECTION A : GESTION DES UTILISATEURS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Cartes de compteurs utilisateurs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Inscrits</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Comptes enregistrés sur la plateforme</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Comptes Actifs</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">{activeUsersCount}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Accès autorisé normal</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Comptes Suspendus</span>
              <p className="text-2xl font-black text-rose-800 mt-1">{suspendedUsersCount}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">Bloqués administrativement</p>
            </div>
          </div>

          {/* Recherche utilisateur */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone ou ville..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold focus:outline-none"
            />
            {searchUser && (
              <button
                type="button"
                onClick={() => setSearchUser('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tableau des utilisateurs */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-3">Rôle</th>
                    <th className="py-3 px-3">Localisation</th>
                    <th className="py-3 px-3">Abonnement</th>
                    <th className="py-3 px-3">Statut Accès</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{u.phoneNumber}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              u.role === 'DEVELOPER'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'PROVIDER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role === 'DEVELOPER' ? 'Développeur' : u.role === 'PROVIDER' ? 'Prestataire' : 'Client'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800">{u.city}</span>
                          <span className="text-[10px] text-slate-400 block">{u.country}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              u.subscriptionStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.subscriptionStatus === 'TRIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {u.subscriptionStatus === 'ACTIVE'
                              ? 'Actif'
                              : u.subscriptionStatus === 'TRIAL'
                              ? 'Essai'
                              : 'Expiré'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {u.isActive ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Voir détails */}
                            <button
                              type="button"
                              onClick={() => setSelectedUserDetail(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              title="Voir la fiche complète"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Bloquer / Débloquer */}
                            <button
                              type="button"
                              onClick={() => handleToggleUserBlock(u.id)}
                              className={`p-1.5 rounded-lg font-bold text-xs ${
                                u.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Suspendre ce compte' : 'Débloquer ce compte'}
                            >
                              {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>

                            {/* Supprimer avec confirmation */}
                            {u.role !== 'DEVELOPER' && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B : JOURNAL D'ACTIVITÉS & AUDIT RÉEL */}
      {activeTab === 'ACTIVITIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Journal d'Audit des Événements Réels Plateforme</h3>
                <p className="text-xs text-slate-500">Traçabilité complète des actions utilisateurs depuis Supabase sans données sensibles.</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {activitiesLog.length} Événements récents
              </span>
            </div>

            {activitiesLog.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Aucune activité récente enregistrée pour le moment</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Les actions effectuées par les utilisateurs (inscriptions, connexions, paiements, modifications) apparaîtront ici automatiquement en temps réel.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activitiesLog.map((act) => (
                  <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                        act.status === 'FAILURE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {act.type}
                      </span>
                      <div>
                        <p className="font-black text-slate-900">{act.details}</p>
                        <p className="text-[11px] text-slate-500">Compte concerné : {act.accountEmail}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0 sm:text-right">
                      {act.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION C : SUIVI DES ERREURS & INCIDENTS RÉELS */}
      {activeTab === 'ERRORS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Suivi des Erreurs et Incidents Techniques Réels</h3>
              <p className="text-xs text-slate-500">Surveillance des échecs de connexion, d'inscription ou d'accès bloqués.</p>
            </div>

            {errorsLog.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-900">Aucun incident technique signalé</p>
                <p className="text-xs text-emerald-700 mt-1">Tous les services fonctionnent normalement sans erreur enregistrée.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {errorsLog.map((err) => (
                  <div
                    key={err.id}
                    className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                            {err.module}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{err.timestamp}</span>
                        </div>
                        <p className="font-bold text-slate-900 mt-1">{err.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 self-start sm:self-center">
                      Échec détecté
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION D : GESTION DES ABONNEMENTS RÉELS */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Suivi des Abonnements & Essais Gratuits Réels</h3>
                <p className="text-xs text-slate-500">
                  Prestataires : 30 jours gratuits puis 5 000 FCFA/mois • Clients : paiement à l'acte par déblocage de contact (1 000 FCFA).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Statut</th>
                    <th className="py-3 px-3">Date Expiration</th>
                    <th className="py-3 px-3">Règlement</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptionsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        Aucun abonnement prestataire enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    subscriptionsList.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{sub.userEmail}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{sub.accountType}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'TRIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.status === 'ACTIVE'
                              ? 'Payé & Actif'
                              : sub.status === 'TRIAL'
                              ? 'Essai Gratuit'
                              : 'Expiré (Accès restreint)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{sub.expiresAt}</td>
                        <td className="py-3 px-3">
                          <span className="font-black text-slate-900">{sub.amountPaid.toLocaleString('fr-FR')} FCFA</span>
                          <span className="text-[10px] text-slate-400 block">{sub.paymentRef}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleExtendSub(sub.id)}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl text-[11px] transition border border-brand-200"
                          >
                            Prolonger 30j
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E : PUBLICITÉS */}
      {activeTab === 'ADS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Politique & Campagnes Publicitaires</h3>
              <p className="text-xs text-slate-500">
                Tarification fixe appliquée par le serveur : 1 000 FCFA / semaine de visibilité.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { label: '1 Semaine', price: '1 000 FCFA', duration: '7 jours' },
                { label: '2 Semaines', price: '2 000 FCFA', duration: '14 jours' },
                { label: '3 Semaines', price: '3 000 FCFA', duration: '21 jours' },
                { label: '4 Semaines', price: '4 000 FCFA', duration: '28 jours' },
              ].map((tier) => (
                <div key={tier.label} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">{tier.duration}</span>
                  <p className="text-base font-black text-amber-950 mt-0.5">{tier.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION F : MÉTRIQUES & FLUX RÉELS */}
      {activeTab === 'METRICS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Flux Financier Réel</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
            <p className="text-xs text-slate-500 mt-0.5">Paiements validés dans Supabase</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Total Utilisateurs Réels</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.totalUsers}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{metrics.totalProviders} Prestataires • {metrics.totalClients} Clients</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Campagnes Publicitaires</span>
            <p className="text-2xl font-black text-purple-700 mt-1">{metrics.totalActiveAds} Actives</p>
            <p className="text-xs text-purple-600 mt-0.5">Diffusées en direct sur l'app ({metrics.totalLogs} logs d'audit)</p>
          </div>
        </div>
      )}

      {/* MODAL FICHE DÉTAILLÉE UTILISATEUR */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Détails du Compte Utilisateur</h3>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Nom complet :</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Email :</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Téléphone :</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Rôle :</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Localisation :</span>
                <span className="font-bold text-slate-900">
                  {selectedUserDetail.city}, {selectedUserDetail.country}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Statut d'accès :</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.isActive ? 'Actif' : 'Suspendu'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Date d'inscription :</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.createdAt}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserDetail(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
            >
              Fermer la fiche
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION AVANT SUPPRESSION */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-900">Confirmer la suppression irréversible ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous certain de vouloir supprimer le compte de{' '}
                <strong className="text-slate-800">{userToDelete.email}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/25 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
