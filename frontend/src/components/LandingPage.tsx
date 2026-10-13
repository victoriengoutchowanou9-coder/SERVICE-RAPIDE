import React from 'react';
import {
  Zap,
  ShieldCheck,
  Smartphone,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { AFRICAN_COUNTRIES } from '../types';

interface LandingPageProps {
  onStart: (initialRole?: 'CLIENT' | 'PROVIDER') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6">
        {/* Cercles de fond stylisés */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-amber-500 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>La 1ère Plateforme Panafricaine de Services Rapides</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Trouvez un prestataire qualifié en Afrique,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
              en un clin d'œil.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Mise en relation directe entre particuliers et artisans certifiés (Plomberie, Climatisation, Électricité, Mécanique, Coiffure). Tarifs transparents, disponibilité en temps réel et paiement Mobile Money sécurisé.
          </p>

          {/* Boutons d'action principaux */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onStart('CLIENT')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <span>Trouver un Prestataire</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onStart('PROVIDER')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-extrabold text-sm backdrop-blur-md flex items-center justify-center gap-2 transition"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Proposer mes Services (1 mois offert)</span>
            </button>
          </div>

          {/* Badges de confiance */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1 semaine gratuite pour les nouveaux clients</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1 mois gratuit pour les prestataires</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Paiement Mobile Money (Orange, MTN, Moov, Wave)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & PAYS COUVERTS */}
      <section className="bg-white border-y border-slate-200/80 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-wider text-brand-600">
              Déjà présent dans toute l'Afrique
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              Plus de 20 pays connectés en direct
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {AFRICAN_COUNTRIES.slice(0, 10).map((c) => (
              <span
                key={c.code}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
              >
                <span>{c.flag}</span>
                <span>{c.nameFr}</span>
              </span>
            ))}
            <span className="text-xs font-bold text-slate-400 px-2">et bien d'autres...</span>
          </div>
        </div>
      </section>

      {/* 3. COMMENT ÇA MARCHE */}
      <section className="py-16 px-4 max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-brand-600">
            Processus Simple & Transparent
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Comment fonctionne SERVICE RAPIDE ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Une mise en contact sécurisée conçue pour les réalités du marché africain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Étape 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-600 font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                Recherchez & Comparez
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultez les prestataires qualifiés par ville et spécialité. Visualisez leur tarif de base, leurs photos de réalisations et leur disponibilité en temps réel (Disponible / Occupé).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-brand-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tarifs affichés avant contact</span>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                Débloquez le Contact
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Débloquez les coordonnées directes du professionnel pour 1 000 FCFA par Mobile Money (ou 100% GRATUIT durant votre première semaine offerte).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bloqué si le prestataire est occupé</span>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                Échangez sur WhatsApp
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Appelez directement le prestataire ou lancez une conversation WhatsApp en un clic pour organiser l'intervention sur place ou à domicile.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Liaison WhatsApp immédiate</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION DÉDIÉE PRESTATAIRES */}
      <section className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Espace Artisans & Professionnels
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
              Développez votre activité et trouvez des clients chaque jour
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Créez votre profil avec votre photo, vos spécialités et vos tarifs. Basculez en un clic entre « Disponible » et « Occupé », partagez vos chantiers sur le fil d'actualité et recevez des appels directs de clients près de chez vous.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onStart('PROVIDER')}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <span>Rejoindre en tant que Prestataire</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 space-y-4 max-w-sm w-full">
            <h4 className="text-xs font-black uppercase text-emerald-300">
              Conditions Prestataire :
            </h4>
            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>1er mois 100% offert</strong> avant le premier abonnement.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Abonnement mensuel de <strong>5 000 FCFA</strong> seulement.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Vos clients vous appellent sans commission sur vos devis.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. APPEL À L'ACTION FINAL */}
      <section className="py-16 px-4 text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Prêt à démarrer avec SERVICE RAPIDE ?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Rejoignez des milliers d'utilisateurs satisfaits à travers toute l'Afrique. Inscription en 30 secondes.
        </p>
        <div>
          <button
            onClick={() => onStart()}
            className="px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-brand-500/30 transition inline-flex items-center gap-2"
          >
            <span>Créer un compte maintenant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER VITRINE */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-8 px-4 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-xs">
              SR
            </div>
            <span className="font-bold text-white">SERVICE RAPIDE</span>
            <span>— Plateforme Panafricaine</span>
          </div>
          <p>© 2026 SERVICE RAPIDE. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};
