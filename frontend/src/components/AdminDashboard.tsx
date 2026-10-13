import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  CreditCard,
  RotateCcw,
  Sliders,
  CheckCircle,
  XCircle,
  Megaphone,
  Plus,
  Trash2,
  Eye,
  DollarSign,
} from 'lucide-react';

interface AdminDashboardProps {
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'REFUNDS' | 'SETTINGS' | 'ADS'>('METRICS');
  const [feedback, setFeedback] = useState<string | null>(null);

  // État Réclamations Remboursement (4. VALIDATION STRICTEMENT MANUELLE)
  const [refundRequests, setRefundRequests] = useState([
    {
      id: 'ref-1',
      clientEmail: 'client.dakar@example.com',
      providerSingleName: 'Koffi',
      reason: 'Le prestataire a indiqué ne plus être disponible dans mon secteur.',
      status: 'PENDING',
      createdAt: '2026-10-12 14:30',
      amount: 1000,
    },
    {
      id: 'ref-2',
      clientEmail: 'client.abidjan@example.com',
      providerSingleName: 'Bakary',
      reason: 'Numéro injoignable pendant 24 heures.',
      status: 'PENDING',
      createdAt: '2026-10-13 08:15',
      amount: 1000,
    },
  ]);

  // 6. GESTION DES PRIX ET PÉRIODES GRATUITES
  const [settings, setSettings] = useState({
    providerSubPrice: '5000',
    providerTrialMonths: '1',
    clientContactPrice: '1000',
    clientTrialDays: '7',
  });

  // 5. & 6. SECTION PUBLICATION ET PUBLICITÉ
  const [ads, setAds] = useState([
    {
      id: 'ad-1',
      title: 'Outillage Professionnel Bosch Afrique',
      content: 'Bénéficiez de 20% de remise sur tous les équipements de chantiers.',
      targetCountry: 'ALL',
      isActive: true,
      views: 1240,
      clicks: 89,
    },
    {
      id: 'ad-2',
      title: 'Assurance Chantier & Habitation Sanlam',
      content: 'Couverture immédiate de vos interventions techniques.',
      targetCountry: 'CI',
      isActive: true,
      views: 540,
      clicks: 34,
    },
  ]);

  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdContent, setNewAdContent] = useState('');

  // 4. ACTION MANUELLE VALIDATION / REJET REMBOURSEMENT
  const handleProcessRefund = (id: string, action: 'APPROVE' | 'REJECT') => {
    setRefundRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : r
      )
    );
    setFeedback(
      `Demande #${id} ${action === 'APPROVE' ? 'VALIDÉE (1 000 FCFA remboursé)' : 'REJETÉE'} manuellement.`
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('Paramètres globaux (tarifs et gratuité) mis à jour avec succès.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle) return;
    const ad = {
      id: `ad-${Date.now()}`,
      title: newAdTitle,
      content: newAdContent,
      targetCountry: 'ALL',
      isActive: true,
      views: 0,
      clicks: 0,
    };
    setAds([ad, ...ads]);
    setNewAdTitle('');
    setNewAdContent('');
    setFeedback('Nouvelle publicité panafricaine publiée avec succès !');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* En-tête Administration */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Supervision & Administration Centrale
          </h2>
          <p className="text-xs text-slate-500">
            Gestion des flux, règlements, remboursements manuels et politiques tarifaires.
          </p>
        </div>

        {/* Navigation des Onglets */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'METRICS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Métriques
          </button>
          <button
            onClick={() => setActiveTab('REFUNDS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'REFUNDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Remboursements</span>
            {refundRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'SETTINGS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Prix & Périodes
          </button>
          <button
            onClick={() => setActiveTab('ADS')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'ADS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Publicités
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 6. TAB 1 : TABLEAU DE BORD & METRIQUES */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Utilisateurs</span>
              <p className="text-xl font-black text-slate-900 mt-1">1,480</p>
              <span className="text-[10px] text-emerald-600 font-bold">+18% cette semaine</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Prestataires Actifs</span>
              <p className="text-xl font-black text-brand-600 mt-1">324</p>
              <span className="text-[10px] text-slate-500">Abonnement à jour</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Volume Paiements</span>
              <p className="text-xl font-black text-slate-900 mt-1">2,850,000</p>
              <span className="text-[10px] text-slate-500">FCFA Mobile Money</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Remboursements Attente</span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {refundRequests.filter((r) => r.status === 'PENDING').length}
              </p>
              <span className="text-[10px] text-rose-500 font-bold">Action manuelle requise</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. & 6. TAB 2 : GESTION DES REMBOURSEMENTS MANUELS */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800">
              Demandes de Remboursement Clients
            </h3>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
              Validation Manuelle par Admin Uniquement
            </span>
          </div>

          <div className="space-y-3">
            {refundRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{req.clientEmail}</span>
                    <span className="text-[10px] text-slate-400">({req.createdAt})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Prestataire concerné : <strong>{req.providerSingleName}</strong> • Montant :{' '}
                    <strong>{req.amount} FCFA</strong>
                  </p>
                  <p className="text-xs italic text-slate-500 mt-1 bg-white p-2 rounded-xl border border-slate-100">
                    « {req.reason} »
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleProcessRefund(req.id, 'APPROVE')}
                        className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accepter</span>
                      </button>
                      <button
                        onClick={() => handleProcessRefund(req.id, 'REJECT')}
                        className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeter</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'APPROVED' ? 'Remboursement Validé' : 'Demande Rejetée'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 3 : GESTION DES PRIX ET PÉRIODES GRATUITES */}
      {activeTab === 'SETTINGS' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800">
              Configuration des Tarifs & Périodes Offertes
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Modifications dynamiques</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 mb-3">Prestataires</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Prix abonnement mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    value={settings.providerSubPrice}
                    onChange={(e) => setSettings({ ...settings, providerSubPrice: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Période gratuite initiale (Mois)
                  </label>
                  <input
                    type="number"
                    value={settings.providerTrialMonths}
                    onChange={(e) => setSettings({ ...settings, providerTrialMonths: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 mb-3">Clients</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Prix de mise en contact (FCFA)
                  </label>
                  <input
                    type="number"
                    value={settings.clientContactPrice}
                    onChange={(e) => setSettings({ ...settings, clientContactPrice: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Semaine d'essai offerte (Jours)
                  </label>
                  <input
                    type="number"
                    value={settings.clientTrialDays}
                    onChange={(e) => setSettings({ ...settings, clientTrialDays: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            Enregistrer les configurations
          </button>
        </form>
      )}

      {/* 5. & 6. TAB 4 : PUBLICITÉS & PUBLICATIONS */}
      {activeTab === 'ADS' && (
        <div className="space-y-5">
          <form
            onSubmit={handleCreateAd}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3"
          >
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Créer une Publication Sponsorisée
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="Titre de la publicité..."
                value={newAdTitle}
                onChange={(e) => setNewAdTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white"
              />
              <textarea
                rows={2}
                placeholder="Description / offre promotionnelle..."
                value={newAdContent}
                onChange={(e) => setNewAdContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publier l'annonce</span>
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-900">{ad.title}</h5>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Actif
                  </span>
                </div>
                <p className="text-xs text-slate-600">{ad.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>Vues : {ad.views}</span>
                  <span>Clics : {ad.clicks}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
