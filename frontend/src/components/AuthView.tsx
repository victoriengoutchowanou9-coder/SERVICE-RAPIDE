import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Briefcase,
  Download,
} from 'lucide-react';
import { supabaseBackend } from '../config/supabase';
import { GeoCascadeSelect, GeoSelection } from './GeoCascadeSelect';
import { getDialCodeForCountry } from '../data/geoData';
import { InstallAppModal } from './InstallAppModal';

interface AuthViewProps {
  country: string;
  language: string;
  initialMode?: 'REGISTER' | 'LOGIN';
  onNavigate?: (mode: 'REGISTER' | 'LOGIN') => void;
  onSuccess: (data: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  country,
  language,
  initialMode = 'REGISTER',
  onNavigate,
  onSuccess,
}) => {
  // Modes : 'REGISTER' | 'LOGIN' | 'OTP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'
  const [mode, setMode] = useState<'REGISTER' | 'LOGIN' | 'OTP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'>(initialMode);

  // Synchronisation si initialMode change depuis l'URL ou le Header
  useEffect(() => {
    if (initialMode && mode !== 'OTP' && mode !== 'FORGOT_PASSWORD' && mode !== 'RESET_PASSWORD') {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Champs de saisie
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrIdentifier, setEmailOrIdentifier] = useState('');
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');
  const [serviceOffered, setServiceOffered] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Réinitialisation de mot de passe (Mot de passe oublié)
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Géographie hiérarchique
  const [geo, setGeo] = useState<GeoSelection>({
    country: 'Bénin',
    countryCode: country || 'BJ',
    department: '',
    commune: '',
    city: '',
  });

  // Code indicatif téléphonique dynamique (+229, +225, etc.)
  const phoneDialCode = getDialCodeForCountry(geo.countryCode);

  // OTP & Confirmation Email
  const [otpCode, setOtpCode] = useState('');
  const [otpInfoMsg, setOtpInfoMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Compte à rebours de 60 secondes pour le renvoi d'e-mail / OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // États UI
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gestion de la sélection géographique
  const handleGeoChange = (selection: GeoSelection) => {
    setGeo(selection);
  };

  // Soumission Inscription / Connexion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = emailOrIdentifier.trim();
    const isDevIdentifier =
      cleanInput.toLowerCase() === 'developer_admin' ||
      cleanInput.toLowerCase() === 'developer';

    // 1. Validation Email / Téléphone / Identifiant
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[\+]?[\d\s-]{8,20}$/;

    if (mode === 'REGISTER') {
      if (!cleanInput) {
        setError("L'adresse email est obligatoire.");
        return;
      }
      if (!emailRegex.test(cleanInput)) {
        setError("Format d'adresse email invalide (ex: utilisateur@domaine.com).");
        return;
      }
    } else {
      // Mode LOGIN : Accepte un email valide, un numéro de téléphone ou un identifiant
      if (!cleanInput) {
        setError("Veuillez saisir votre email, numéro de téléphone ou identifiant.");
        return;
      }
      const isPhone = phoneRegex.test(cleanInput.replace(/\s/g, ''));
      if (!emailRegex.test(cleanInput) && !isPhone && !isDevIdentifier) {
        setError("Veuillez saisir un email, numéro de téléphone ou identifiant valide.");
        return;
      }
    }

    // 2. Validation Mot de passe (>= 8 caractères)
    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    // 3. Validations spécifiques à l'inscription
    if (mode === 'REGISTER') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Le prénom et le nom sont obligatoires.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }

      // Validation Téléphone
      const cleanPhoneDigits = rawPhoneNumber.replace(/\D/g, '');
      if (cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 15) {
        setError('Le numéro de téléphone doit comporter entre 8 et 15 chiffres.');
        return;
      }

      // Validation Localisation
      if (!geo.country) {
        setError('Veuillez sélectionner votre pays.');
        return;
      }
      if (!geo.department) {
        setError('Veuillez sélectionner votre département ou région.');
        return;
      }
      if (!geo.commune) {
        setError('Veuillez sélectionner votre commune.');
        return;
      }
      if (!geo.city) {
        setError('Veuillez sélectionner votre ville ou quartier.');
        return;
      }
    }

    setLoading(true);

    try {
      // Sauvegarde du numéro tel que saisi par l'utilisateur (sans indicatif forcé)
      const fullPhone = rawPhoneNumber.trim();

      const data = await supabaseBackend.loginOrRegister({
        email: cleanInput,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: fullPhone,
        role: selectedRole,
        country: geo.country,
        countryCode: geo.countryCode,
        department: geo.department,
        commune: geo.commune,
        city: geo.city,
        serviceOffered: serviceOffered.trim(),
        preferredLanguage: language,
        isRegister: mode === 'REGISTER',
      });

      if (data.requiresOtp || (data as any).requiresEmailConfirmation) {
        setMode('OTP');
        setResendCooldown(60);
        setOtpInfoMsg(data.message || `Un code de confirmation a été envoyé à ${cleanInput}.`);
      } else {
        onSuccess(data);
      }
    } catch (err: any) {
      if (err.requiresEmailConfirmation) {
        setMode('OTP');
        setResendCooldown(60);
        setOtpInfoMsg(err.message || 'Votre e-mail n\'a pas encore été confirmé. Un code de validation vous a été envoyé.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'authentification.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Validation du code OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Le code de confirmation doit être composé de 6 chiffres.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = emailOrIdentifier.trim().toLowerCase();
      const data: any = await supabaseBackend.verifyOtp(cleanEmail, otpCode);

      onSuccess({
        accessToken: data?.accessToken || `sr_session_${Date.now()}`,
        user: data?.user || {
          email: cleanEmail,
          firstName,
          lastName,
          role: selectedRole,
          isActive: true,
          country: geo.country,
          countryCode: geo.countryCode,
          department: geo.department,
          commune: geo.commune,
          city: geo.city,
          preferredLanguage: language,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Code de confirmation invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  // Renvoi d'OTP / e-mail de confirmation
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = emailOrIdentifier.trim().toLowerCase();
      const data: any = await supabaseBackend.resendOtp(cleanEmail);
      setOtpInfoMsg(data.message || 'Nouveau code envoyé par email.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Impossible de renvoyer le code pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  // Demande de code de réinitialisation (Mot de passe oublié)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedbackSuccess(null);
    const cleanInput = emailOrIdentifier.trim();
    if (!cleanInput) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    setLoading(true);
    try {
      const data: any = await supabaseBackend.forgotPassword(cleanInput);
      setFeedbackSuccess(data.message || 'Un code de réinitialisation a été envoyé par e-mail.');
      setMode('RESET_PASSWORD');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la demande de réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  // Validation du code et enregistrement du nouveau mot de passe
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedbackSuccess(null);

    const cleanInput = emailOrIdentifier.trim();
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setError('Le code de réinitialisation doit comporter 6 chiffres.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const data: any = await supabaseBackend.resetPassword({
        email: cleanInput,
        token: resetCode.trim(),
        newPassword,
      });
      setFeedbackSuccess(data.message || 'Votre mot de passe a été modifié avec succès ! Connectez-vous avec votre nouveau mot de passe.');
      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setMode('LOGIN');
    } catch (err: any) {
      setError(err.message || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  // Renvoi du code de réinitialisation
  const handleResendResetCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = emailOrIdentifier.trim().toLowerCase();
      const data: any = await supabaseBackend.forgotPassword(cleanEmail);
      setFeedbackSuccess(data.message || 'Nouveau code envoyé par email.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Impossible de renvoyer le code pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'OTP'
              ? 'Validation de Sécurité OTP'
              : mode === 'REGISTER'
              ? 'Créer votre compte'
              : mode === 'FORGOT_PASSWORD'
              ? 'Mot de passe oublié'
              : mode === 'RESET_PASSWORD'
              ? 'Nouveau mot de passe'
              : 'Connexion à votre espace'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'OTP'
              ? `Entrez le code à 6 chiffres envoyé à ${emailOrIdentifier}`
              : mode === 'REGISTER'
              ? 'Remplissez le formulaire pour rejoindre SERVICE RAPIDE'
              : mode === 'FORGOT_PASSWORD'
              ? 'Saisissez votre email pour recevoir votre code de réinitialisation'
              : mode === 'RESET_PASSWORD'
              ? `Entrez le code reçu et choisissez votre nouveau mot de passe`
              : 'Saisissez vos identifiants pour continuer'}
          </p>
        </div>

        {feedbackSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ÉCRAN VALIDATION OTP */}
        {mode === 'OTP' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {otpInfoMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-2 font-black text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email de confirmation envoyé !</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed font-semibold">
                  👉 <strong>Connexion automatique :</strong> Cliquez simplement sur le lien reçu dans votre email pour vous connecter directement sans avoir à taper de code.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ou entrez le code de confirmation (6 chiffres) :
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 123456"
                  className="w-full text-center tracking-widest text-lg font-black bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Validation en cours...' : 'Activer mon compte'}
            </button>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleResendOtp}
                className="text-brand-600 font-bold hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Renvoyer le code (${resendCooldown}s)`
                    : "Renvoyer l'e-mail de confirmation"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="text-slate-500 font-medium hover:underline"
              >
                Modifier mes coordonnées
              </button>
            </div>
          </form>
        ) : mode === 'FORGOT_PASSWORD' ? (
          /* 2. FORMULAIRE MOT DE PASSE OUBLIÉ */
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse email associée à votre compte *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={emailOrIdentifier}
                  onChange={(e) => setEmailOrIdentifier(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                Entrez votre adresse email. Nous vous enverrons immédiatement un code de réinitialisation sécurisé à 6 chiffres.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !emailOrIdentifier.trim()}
              className="w-full mt-3 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </div>
              ) : (
                <>
                  <span>Envoyer le code de réinitialisation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                  setFeedbackSuccess(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-brand-600 hover:underline inline-flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </form>
        ) : mode === 'RESET_PASSWORD' ? (
          /* 3. FORMULAIRE DÉFINITION DU NOUVEAU MOT DE PASSE */
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Code de réinitialisation (6 chiffres) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoComplete="off"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 123456"
                  className="w-full text-center tracking-widest text-lg font-black bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nouveau mot de passe *
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Au moins 8 caractères
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Votre nouveau mot de passe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmer le nouveau mot de passe *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Répétez votre nouveau mot de passe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || resetCode.length !== 6 || newPassword.length < 8}
              className="w-full mt-3 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </div>
              ) : (
                <>
                  <span>Enregistrer le nouveau mot de passe</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleResendResetCode}
                className="text-brand-600 font-bold hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Renvoyer le code (${resendCooldown}s)`
                    : 'Renvoyer le code'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                  setFeedbackSuccess(null);
                }}
                className="text-slate-500 font-medium hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </form>
        ) : (
          /* 4. FORMULAIRE D'INSCRIPTION / CONNEXION */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PRÉNOM ET NOM (INSCRIPTION SEULEMENT) */}
            {mode === 'REGISTER' && (
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
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="words"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
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
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="words"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL, TÉLÉPHONE OU IDENTIFIANT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {mode === 'REGISTER' ? 'Adresse email *' : 'Email, Téléphone ou Identifiant *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  value={emailOrIdentifier}
                  onChange={(e) => setEmailOrIdentifier(e.target.value)}
                  placeholder={
                    mode === 'REGISTER'
                      ? 'votre.email@exemple.com'
                      : 'votre.email@exemple.com, 97000000 ou identifiant'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* TÉLÉPHONE (INSCRIPTION) SANS PRÉFIXE FORCÉ ET VIDE PAR DÉFAUT */}
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    value={rawPhoneNumber}
                    onChange={(e) => setRawPhoneNumber(e.target.value.replace(/[^\d\s\+]/g, ''))}
                    placeholder="Ex: 97000000 ou +22997000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Saisissez votre numéro avec ou sans indicatif international (champ libre).
                </p>
              </div>
            )}

            {/* RÔLE DU COMPTE (INSCRIPTION SEULEMENT) */}
            {mode === 'REGISTER' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type de compte *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('CLIENT')}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedRole === 'CLIENT'
                          ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 font-semibold hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-600" />
                        <span>Client</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Recherche et contact de prestataires
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('PROVIDER')}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedRole === 'PROVIDER'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 font-semibold hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Prestataire</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Proposer vos services aux particuliers
                      </p>
                    </button>
                  </div>
                </div>

                {selectedRole === 'PROVIDER' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Métier / Spécialité principale *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      value={serviceOffered}
                      onChange={(e) => setServiceOffered(e.target.value)}
                      placeholder="Ex: Électricien, Plombier, Frigoriste, Coiffeuse..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SÉLECTION GÉOGRAPHIQUE HIÉRARCHIQUE EN CASCADE : PAYS -> DÉPARTEMENT -> COMMUNE -> VILLE */}
            {mode === 'REGISTER' && (
              <div className="pt-2 border-t border-slate-100">
                <GeoCascadeSelect
                  initialValues={{
                    country: geo.country,
                    countryCode: geo.countryCode,
                    department: geo.department,
                    commune: geo.commune,
                    city: geo.city,
                  }}
                  onChange={handleGeoChange}
                  required={true}
                />
              </div>
            )}

            {/* MOT DE PASSE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mot de passe *
                </label>
                {mode === 'LOGIN' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_PASSWORD');
                      setError(null);
                      setFeedbackSuccess(null);
                    }}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline transition"
                  >
                    Mot de passe oublié ?
                  </button>
                ) : (
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
                  minLength={8}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
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

            {/* CONFIRMER LE MOT DE PASSE (INSCRIPTION) */}
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
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

            {/* BOUTON D'ACTION PRINCIPAL : "S'inscrire" OU "Se connecter" (AUCUNE MENTION OTP) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'REGISTER' ? 'Inscription en cours...' : 'Connexion en cours...'}</span>
                </div>
              ) : (
                <>
                  <span>{mode === 'REGISTER' ? "S'inscrire" : 'Se connecter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* BASCULE CONNEXION / INSCRIPTION */}
        {(mode === 'REGISTER' || mode === 'LOGIN') && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {mode === 'REGISTER' ? (
              <p className="text-xs text-slate-600 font-medium">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                    onNavigate?.('LOGIN');
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
                    onNavigate?.('REGISTER');
                  }}
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition"
                >
                  Créer un compte
                </button>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bannière Télécharger l'application PWA */}
      <div className="mt-4 p-4 bg-white/95 backdrop-blur-xs rounded-3xl border border-slate-200/80 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Télécharger l'application</p>
            <p className="text-[10px] text-slate-500 font-medium">Installez SERVICE RAPIDE sur votre téléphone</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-xl shrink-0 shadow-xs transition"
        >
          Installer
        </button>
      </div>

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
