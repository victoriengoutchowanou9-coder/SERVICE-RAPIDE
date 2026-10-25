import React, { useState } from 'react';
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
  React.useEffect(() => {
    if (activeTabOverride) {
      setActiveTab(activeTabOverride);
    }
  }, [activeTabOverride]);

  // A. ÉTAT UTILISATEURS (AVEC STATUT ACTIF / SUSPENDU / SUPPRIMÉ)
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
  }>>([
    {
      id: 'usr-1',
      email: 'victorien@example.com',
      fullName: 'Victorien Agossou',
      phoneNumber: '+229 97 00 11 22',
      role: 'CLIENT',
      country: 'Bénin',
      city: 'Cotonou',
      isActive: true,
      createdAt: '2026-10-20',
      subscriptionStatus: 'ACTIVE',
    },
    {
      id: 'usr-2',
      email: 'moussa.traore@pro.ci',
      fullName: 'Moussa Traoré (Électro-Clim)',
      phoneNumber: '+225 07 44 55 66',
      role: 'PROVIDER',
      country: "Côte d'Ivoire",
      city: 'Abidjan',
      isActive: true,
      createdAt: '2026-10-15',
      subscriptionStatus: 'ACTIVE',
    },
    {
      id: 'usr-3',
      email: 'aicha.diop@client.sn',
      fullName: 'Aïcha Diop',
      phoneNumber: '+221 77 12 34 56',
      role: 'CLIENT',
      country: 'Sénégal',
      city: 'Dakar',
      isActive: false, // Compte suspendu
      createdAt: '2026-10-10',
      subscriptionStatus: 'EXPIRED',
    },
    {
      id: 'usr-4',
      email: 'koffi.mensah@auto.tg',
      fullName: 'Koffi Mensah (Mécanique)',
      phoneNumber: '+228 90 88 77 66',
      role: 'PROVIDER',
      country: 'Togo',
      city: 'Lomé',
      isActive: true,
      createdAt: '2026-10-24',
      subscriptionStatus: 'TRIAL',
    },
    {
      id: 'usr-5',
      email: 'developer_admin@servicerapide.africa',
      fullName: 'Superviseur Principal',
      phoneNumber: '+229 00 00 00 00',
      role: 'DEVELOPER',
      country: 'Panafrique',
      city: 'Direction Technique',
      isActive: true,
      createdAt: '2026-10-01',
      subscriptionStatus: 'ACTIVE',
    },
  ]);

  const [searchUser, setSearchUser] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // B. JOURNAL D'ACTIVITÉS (AUDIT TRAIL SÉCURISÉ)
  const [activitiesLog, setActivitiesLog] = useState<Array<{
    id: string;
    timestamp: string;
    type: 'AUTH_LOGIN' | 'SUBSCRIPTION_RENEW' | 'PAYMENT_SASPAY' | 'ACCOUNT_BLOCKED' | 'AD_PUBLISHED';
    accountEmail: string;
    details: string;
  }>>([
    {
      id: 'act-1',
      timestamp: '25/10/2026 06:20',
      type: 'AUTH_LOGIN',
      accountEmail: 'developer_admin@servicerapide.africa',
      details: 'Connexion superviseur réussie via la mire unique',
    },
    {
      id: 'act-2',
      timestamp: '25/10/2026 05:48',
      type: 'PAYMENT_SASPAY',
      accountEmail: 'moussa.traore@pro.ci',
      details: 'Paiement Mobile Money validé : Abonnement Prestataire Pro 5 000 FCFA',
    },
    {
      id: 'act-3',
      timestamp: '24/10/2026 21:15',
      type: 'AD_PUBLISHED',
      accountEmail: 'quincaillerie.moderne@btp.ci',
      details: 'Publicité sponsorisée activée : 2 semaines (2 000 FCFA)',
    },
    {
      id: 'act-4',
      timestamp: '24/10/2026 18:30',
      type: 'ACCOUNT_BLOCKED',
      accountEmail: 'aicha.diop@client.sn',
      details: 'Compte suspendu suite à signalement d’impayé',
    },
    {
      id: 'act-5',
      timestamp: '24/10/2026 14:02',
      type: 'SUBSCRIPTION_RENEW',
      accountEmail: 'victorien@example.com',
      details: 'Pass contact client débloqué après semaine gratuite (1 000 FCFA)',
    },
  ]);

  // C. SUIVI DES ERREURS TECHNIQUES & INCIDENTS
  const [errorsLog, setErrorsLog] = useState<Array<{
    id: string;
    timestamp: string;
    module: 'SASPAY_CHECKOUT' | 'AUTH_SERVER' | 'DATABASE_RLS' | 'GEO_API';
    message: string;
    resolved: boolean;
  }>>([
    {
      id: 'err-1',
      timestamp: '25/10/2026 04:12',
      module: 'SASPAY_CHECKOUT',
      message: 'Timeout réseau temporaire lors de l’initialisation checkout Orange Money',
      resolved: true,
    },
    {
      id: 'err-2',
      timestamp: '24/10/2026 22:45',
      module: 'AUTH_SERVER',
      message: 'Tentative de connexion avec mot de passe erroné (3 tentatives)',
      resolved: true,
    },
    {
      id: 'err-3',
      timestamp: '24/10/2026 16:10',
      module: 'DATABASE_RLS',
      message: 'Requête anonyme bloquée par RLS sur la table provider_profiles',
      resolved: true,
    },
  ]);

  // D. GESTION DES ABONNEMENTS
  const [subscriptionsList, setSubscriptionsList] = useState<Array<{
    id: string;
    userEmail: string;
    accountType: 'Client' | 'Prestataire';
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PENDING';
    expiresAt: string;
    amountPaid: number;
    paymentRef: string;
  }>>([
    {
      id: 'sub-1',
      userEmail: 'moussa.traore@pro.ci',
      accountType: 'Prestataire',
      status: 'ACTIVE',
      expiresAt: '25/11/2026',
      amountPaid: 5000,
      paymentRef: 'SASPAY-MOMO-98721',
    },
    {
      id: 'sub-2',
      userEmail: 'koffi.mensah@auto.tg',
      accountType: 'Prestataire',
      status: 'TRIAL',
      expiresAt: '24/11/2026',
      amountPaid: 0,
      paymentRef: 'ESSAI-GRATUIT-30J',
    },
    {
      id: 'sub-3',
      userEmail: 'victorien@example.com',
      accountType: 'Client',
      status: 'ACTIVE',
      expiresAt: '20/11/2026',
      amountPaid: 1000,
      paymentRef: 'SASPAY-MOMO-55421',
    },
    {
      id: 'sub-4',
      userEmail: 'aicha.diop@client.sn',
      accountType: 'Client',
      status: 'EXPIRED',
      expiresAt: '17/10/2026',
      amountPaid: 0,
      paymentRef: 'ESSAI-7J-TERMINE',
    },
  ]);

  // Actions de modération
  const handleToggleUserBlock = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextState = !u.isActive;
          const logEntry = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            type: nextState ? ('AUTH_LOGIN' as const) : ('ACCOUNT_BLOCKED' as const),
            accountEmail: u.email,
            details: nextState ? 'Compte débloqué par l’administrateur' : 'Compte bloqué / suspendu par l’administrateur',
          };
          setActivitiesLog((logs) => [logEntry, ...logs]);
          setFeedback(`Compte ${u.email} ${nextState ? 'DÉBLOQUÉ' : 'SUSPENDU'} avec succès.`);
          setTimeout(() => setFeedback(null), 3500);
          return { ...u, isActive: nextState };
        }
        return u;
      })
    );
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
    const logEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      type: 'ACCOUNT_BLOCKED' as const,
      accountEmail: userToDelete.email,
      details: `Compte ${userToDelete.email} supprimé définitivement par la supervision centrale`,
    };
    setActivitiesLog((logs) => [logEntry, ...logs]);
    setFeedback(`Compte ${userToDelete.email} supprimé définitivement avec succès.`);
    setUserToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleExtendSub = (subId: string) => {
    setSubscriptionsList((prev) =>
      prev.map((s) => {
        if (s.id === subId) {
          return {
            ...s,
            status: 'ACTIVE',
            expiresAt: '30/12/2026',
            paymentRef: 'VALIDATION-ADMIN-MANUELLE',
          };
        }
        return s;
      })
    );
    setFeedback('Abonnement prolongé de 30 jours suite à vérification administrative.');
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtrage des utilisateurs
  const filteredUsers = usersList.filter((u) => {
    const q = searchUser.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.phoneNumber.includes(q) ||
      u.city.toLowerCase().includes(q)
    );
  });

  const totalUsers = usersList.length;
  const activeUsersCount = usersList.filter((u) => u.isActive).length;
  const suspendedUsersCount = usersList.filter((u) => !u.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* En-tête supervision sécurisée (titre et statut) */}
      <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full">
                ● Superviseur Développeur Autorisé
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
                  {filteredUsers.map((u) => (
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
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">{u.city}</span>
                        <span className="text-[10px] text-slate-400 block">{u.country}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            u.subscriptionStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.subscriptionStatus === 'TRIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span>{u.isActive ? '● Actif' : '✖ Suspendu'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Voir détails */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetail(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B : JOURNAL D'ACTIVITÉS & AUDIT */}
      {activeTab === 'ACTIVITIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Journal d'Audit des Événements Plateforme</h3>
                <p className="text-xs text-slate-500">Traçabilité complète sans enregistrement de mots de passe ou secrets.</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {activitiesLog.length} Événements récents
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activitiesLog.map((act) => (
                <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
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
          </div>
        </div>
      )}

      {/* SECTION C : SUIVI DES ERREURS & INCIDENTS */}
      {activeTab === 'ERRORS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Suivi des Erreurs et Incidents Techniques</h3>
              <p className="text-xs text-slate-500">Surveillance des échecs de paiement SasPay et des blocages de sécurité.</p>
            </div>

            <div className="space-y-2.5">
              {errorsLog.map((err) => (
                <div
                  key={err.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {err.module}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{err.timestamp}</span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{err.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 self-start sm:self-center">
                    Traitée / Archivée
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION D : GESTION DES ABONNEMENTS */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Suivi des Abonnements & Essais Gratuits</h3>
                <p className="text-xs text-slate-500">
                  Règles actives : Clients (7 jours gratuits puis 1 000 FCFA/mois) • Prestataires (30 jours gratuits puis 5 000 FCFA/mois)
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
                  {subscriptionsList.map((sub) => (
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
                        <span className="font-black text-slate-900">{sub.amountPaid.toLocaleString()} FCFA</span>
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
                  ))}
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

      {/* SECTION F : MÉTRIQUES & FLUX GLOBAUX */}
      {activeTab === 'METRICS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Flux SasPay Total</span>
            <p className="text-2xl font-black text-slate-900 mt-1">45 000 FCFA</p>
            <p className="text-xs text-slate-500 mt-0.5">Mobile Money cumulé ce mois</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Taux de Conversion</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">87.5%</p>
            <p className="text-xs text-emerald-600 mt-0.5">Paiements validés sans rejet</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Campagnes Pubs</span>
            <p className="text-2xl font-black text-purple-700 mt-1">12 En cours</p>
            <p className="text-xs text-purple-600 mt-0.5">Diffusées en direct sur l'app</p>
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
