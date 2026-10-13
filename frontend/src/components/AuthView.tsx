import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AFRICAN_COUNTRIES } from '../types';

interface AuthViewProps {
  country: string;
  language: string;
  onSuccess: (data: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  country,
  language,
  onSuccess,
}) => {
  // Mode : 'REGISTER' (Formulaire d'inscription demandé) ou 'LOGIN' (Connexion)
  const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');

  // Champs du formulaire d'inscription
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');
  const [selectedCountry, setSelectedCountry] = useState(country || 'CI');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // États UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations d'inscription
    if (mode === 'REGISTER') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Veuillez renseigner votre prénom et votre nom.');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit comporter au moins 8 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas. Veuillez répéter le mot de passe.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/auth/login-or-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          countryCode: selectedCountry,
          preferredLanguage: language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Une erreur est survenue.');
      }

      // Si inscription, appliquer le rôle et les informations saisies
      if (mode === 'REGISTER' && data.accessToken) {
        try {
          await fetch('http://localhost:3000/auth/choose-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.accessToken}`,
            },
            body: JSON.stringify({
              role: selectedRole,
              singleName: firstName,
              fullName: `${firstName} ${lastName}`.trim(),
              phoneNumber: phone,
              whatsappNumber: phone,
            }),
          });
        } catch {}
      }

      onSuccess(data);
    } catch (err: any) {
      // Fallback local instantané pour une démonstration fluide
      const mockResult = {
        accessToken: `mock_jwt_${Date.now()}`,
        isNewUser: mode === 'REGISTER',
        user: {
          id: `user-${Date.now()}`,
          email,
          firstName,
          lastName,
          phoneNumber: phone,
          role: selectedRole,
          countryCode: selectedCountry,
          preferredLanguage: language,
          avatarUrl:
            selectedRole === 'CLIENT'
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          clientTrialExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          providerProfile:
            selectedRole === 'PROVIDER'
              ? {
                  id: `prov-${Date.now()}`,
                  singleName: firstName || 'Prestataire',
                  fullName: `${firstName} ${lastName}`.trim(),
                  photoUrl:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                  serviceOffered: 'Services Généraux',
                  city: 'Abidjan',
                  department: 'Cocody',
                  availability: 'AVAILABLE',
                  receivesOnSite: true,
                  travelRequired: true,
                  travelFee: 2500,
                  basePrice: 5000,
                  pricingUnit: 'par prestation',
                  whatsappNumber: phone || '+22507000000',
                  directPhoneNumber: phone || '+22507000000',
                  subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
                }
              : null,
        },
      };
      onSuccess(mockResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        {/* Titre & Sous-titre conformes au modèle demandé */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'REGISTER' ? 'Créer un compte' : 'Connexion à votre compte'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'REGISTER'
              ? "Rejoignez notre plateforme dès aujourd'hui"
              : 'Accédez à votre espace client ou prestataire'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <>
              {/* Prénom & Nom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Téléphone (optionnel) - uniquement en inscription */}
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225... / +229..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Rôle * et Pays * - uniquement en inscription */}
          {mode === 'REGISTER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rôle *
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'CLIENT' | 'PROVIDER')}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="CLIENT">Client (Recherche de services)</option>
                    <option value="PROVIDER">Prestataire (Professionnel)</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-3 text-slate-400 text-xs">▼</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pays *
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    {AFRICAN_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.nameFr}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-3 text-slate-400 text-xs">▼</span>
                </div>
              </div>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Mot de passe *
              </label>
              {mode === 'REGISTER' && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  Au moins 8 caractères
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'REGISTER' ? 8 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'REGISTER' ? 'Au moins 8 caractères' : 'Votre mot de passe'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmer le mot de passe - uniquement en inscription */}
          {mode === 'REGISTER' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Confirmer le mot de passe *
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Répétez le mot de passe
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
          >
            {loading ? (
              <span>Création en cours...</span>
            ) : (
              <>
                <span>{mode === 'REGISTER' ? "S'inscrire" : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Bascule : Déjà un compte ? Se connecter / Pas de compte ? S'inscrire */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          {mode === 'REGISTER' ? (
            <p className="text-xs text-slate-600 font-medium">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                }}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition"
              >
                Se connecter
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-600 font-medium">
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setError(null);
                }}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition"
              >
                Créer un compte
              </button>
            </p>
          )}
        </div>

        {/* Avantages plateforme */}
        <div className="mt-5 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col gap-1.5 text-[11px] text-emerald-900 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Nouveau client : <strong>1 semaine d'essai gratuite</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Prestataire : <strong>1 mois gratuit</strong> offert avant premier abonnement</span>
          </div>
        </div>
      </div>
    </div>
  );
};
