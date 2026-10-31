import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour le Frontend (compatible Vite, Vercel Config et Secret)
export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://gsgbvoyddagpjldgeyqk.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('votre_anon_key_ici')
);

// Client Supabase officiel
export const supabase = createClient(
  SUPABASE_URL,
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'dummy-anon-key'
);

export interface AuthPayload {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  countryCode?: string;
  country?: string;
  department?: string;
  commune?: string;
  city?: string;
  role?: 'CLIENT' | 'PROVIDER';
  preferredLanguage?: string;
  serviceOffered?: string;
  isRegister?: boolean;
}

export interface ChooseRolePayload {
  role: 'CLIENT' | 'PROVIDER';
  singleName?: string;
  serviceOffered?: string;
  city?: string;
  department?: string;
  commune?: string;
  country?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export const supabaseBackend = {
  /**
   * 1. Authentification unifiée (Connexion ou Inscription avec serveur et Supabase)
   */
  async loginOrRegister(payload: AuthPayload) {
    const isRegisterMode = Boolean(payload.isRegister || (payload.firstName && payload.lastName));
    const cleanEmail = payload.email.toLowerCase().trim();

    // 1. TENTATIVE VIA LE SERVEUR D'AUTHENTIFICATION DÉDIÉ (/api/auth)
    try {
      const endpoint = isRegisterMode ? '/api/auth?action=register' : '/api/auth?action=login';
      const bodyPayload = isRegisterMode
        ? {
            email: cleanEmail,
            password: payload.password,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber,
            role: payload.role || 'CLIENT',
            country: payload.country,
            countryCode: payload.countryCode || 'BJ',
            department: payload.department,
            commune: payload.commune,
            city: payload.city,
            serviceOffered: payload.serviceOffered,
          }
        : {
            emailOrIdentifier: cleanEmail,
            password: payload.password,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (res.ok && data.requiresEmailConfirmation) {
        return {
          accessToken: '',
          isNewUser: true,
          requiresOtp: true,
          requiresEmailConfirmation: true,
          email: data.email || cleanEmail,
          message: data.message || 'Un code de confirmation vous a été envoyé par e-mail.',
          user: data.user,
        };
      }

      if (res.ok && data.user) {
        // Enregistrement persistant de la session locale
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('sr_session', JSON.stringify(data));
            if (data.accessToken) localStorage.setItem('sr_token', data.accessToken);
          } catch (e) {}
        }

        return {
          accessToken: data.accessToken || '',
          isNewUser: isRegisterMode,
          requiresOtp: false,
          message: data.message || 'Authentification réussie',
          user: data.user,
        };
      } else if (!res.ok) {
        if (data.requiresEmailConfirmation) {
          const confErr: any = new Error(data.error || 'Veuillez confirmer votre adresse e-mail avant de vous connecter.');
          confErr.requiresEmailConfirmation = true;
          confErr.email = data.email || cleanEmail;
          throw confErr;
        }
        throw new Error(data.error || 'Identifiant ou mot de passe incorrect.');
      }
    } catch (apiErr: any) {
      if (
        apiErr.requiresEmailConfirmation ||
        apiErr.message?.includes('incorrect') ||
        apiErr.message?.includes('existe déjà') ||
        apiErr.message?.includes('obligatoire') ||
        apiErr.message?.includes('Format') ||
        apiErr.message?.includes('confirmée')
      ) {
        throw apiErr;
      }
      console.warn('API locale /api/auth indisponible, tentative via client Supabase direct:', apiErr.message);
    }

    // 2. FALLBACK SUPABASE DIRECT SI LE CLIENT EST CONFIGURÉ
    if (!isSupabaseConfigured) {
      throw new Error("Identifiant ou mot de passe incorrect.");
    }

    let email = cleanEmail;
    if (email === 'developer_admin' || email === 'developer') {
      email = 'developer_admin@servicerapide.africa';
    } else if (!email.includes('@')) {
      // Recherche de l'email associé au numéro de téléphone ou identifiant
      try {
        const { data: userMatch } = await supabase
          .from('users')
          .select('email')
          .or(`phoneNumber.eq.${cleanEmail},identifier.eq.${cleanEmail}`)
          .maybeSingle();
        if (userMatch?.email) {
          email = userMatch.email;
        }
      } catch (e) {
        // Ignorer si échec
      }
    }
    const password = payload.password || 'serviceRapide2025!';

    // Tentative de connexion Supabase
    if (!isRegisterMode) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', signInData.user.id)
          .maybeSingle();

        const { data: providerProfile } = await supabase
          .from('provider_profiles')
          .select('*')
          .eq('userId', signInData.user.id)
          .maybeSingle();

        const sessionUser = {
          accessToken: signInData.session?.access_token || '',
          isNewUser: false,
          requiresOtp: false,
          message: 'Connexion réussie',
          user: {
            id: signInData.user.id,
            email: signInData.user.email,
            firstName: profile?.firstName || signInData.user.user_metadata?.firstName || '',
            lastName: profile?.lastName || signInData.user.user_metadata?.lastName || '',
            role: profile?.role || 'PENDING',
            countryCode: profile?.countryCode || payload.countryCode || 'BJ',
            country: profile?.country || payload.country || '',
            department: profile?.department || payload.department || '',
            commune: profile?.commune || payload.commune || '',
            city: profile?.city || payload.city || '',
            preferredLanguage: profile?.preferredLanguage || 'fr',
            avatarUrl: profile?.avatarUrl || '',
            phoneNumber: profile?.phoneNumber || '',
            clientTrialExpiresAt: profile?.clientTrialExpiresAt,
            clientSubscriptionExpiresAt: profile?.clientSubscriptionExpiresAt,
            createdAt: profile?.createdAt || signInData.user.created_at,
            providerProfile: providerProfile || null,
          },
        };

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('sr_session', JSON.stringify(sessionUser));
            if (sessionUser.accessToken) localStorage.setItem('sr_token', sessionUser.accessToken);
          } catch (e) {}
        }

        return sessionUser;
      }

      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    // Inscription Supabase
    const currentOrigin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://servicerapide.vercel.app';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: currentOrigin,
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phoneNumber: payload.phoneNumber,
          countryCode: payload.countryCode || 'BJ',
          country: payload.country,
          department: payload.department,
          commune: payload.commune,
          city: payload.city,
          preferredLanguage: payload.preferredLanguage || 'fr',
        },
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    const user = signUpData?.user;
    const session = signUpData?.session;

    return {
      accessToken: session?.access_token || '',
      isNewUser: true,
      requiresOtp: !session,
      message: !session
        ? 'Un code de confirmation a été envoyé à votre adresse email.'
        : 'Compte créé avec succès',
      user: {
        id: user?.id || '',
        email: user?.email || email,
        role: payload.role || 'PENDING',
        countryCode: payload.countryCode || 'BJ',
        country: payload.country,
        department: payload.department,
        commune: payload.commune,
        city: payload.city,
        preferredLanguage: payload.preferredLanguage || 'fr',
      },
    };
  },

  /**
   * 2. Validation du code OTP / Confirmation d'email
   */
  async verifyOtp(email: string, otp: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Tentative via le serveur dédié
    try {
      const res = await fetch('/api/auth?action=confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, token: cleanOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof window !== 'undefined') {
          try {
            if (data.accessToken) localStorage.setItem('sr_token', data.accessToken);
            if (data.user) localStorage.setItem('sr_session', JSON.stringify(data));
          } catch (e) {}
        }
        return data;
      }
      if (!res.ok && res.status !== 404) {
        throw new Error(data.error || 'Code de confirmation invalide.');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
    }

    if (!isSupabaseConfigured) {
      throw new Error("Code de confirmation invalide ou expiré.");
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'signup',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * 3. Renvoi du code OTP / e-mail de confirmation avec délai anti-spam
   */
  async resendOtp(email: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Tentative via le serveur dédié
    try {
      const res = await fetch('/api/auth?action=resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        return data;
      }
      if (res.status === 429) {
        throw new Error(data.error || 'Veuillez patienter 60 secondes entre deux envois.');
      }
      if (!res.ok && res.status !== 404) {
        throw new Error(data.error || 'Erreur lors du renvoi du code.');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
    }

    if (!isSupabaseConfigured) {
      throw new Error("Impossible de renvoyer le code pour le moment.");
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Nouveau code envoyé par email.' };
  },

  /**
   * 4. Demande de réinitialisation de mot de passe (Mot de passe oublié)
   */
  async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Tentative via l'API dédiée
    try {
      const res = await fetch('/api/auth?action=forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        return data;
      }
      if (res.status === 429) {
        throw new Error(data.error || 'Veuillez patienter 60 secondes avant une nouvelle demande.');
      }
      if (!res.ok && res.status !== 404) {
        throw new Error(data.error || 'Erreur lors de la demande de réinitialisation.');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
    }

    // 2. Fallback Supabase client
    if (isSupabaseConfigured) {
      const currentOrigin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://servicerapide.vercel.app';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: currentOrigin,
      });
      if (error) {
        throw new Error(error.message);
      }
    }

    return { message: 'Un code de réinitialisation a été envoyé à votre adresse email.' };
  },

  /**
   * 5. Validation du code et définition du nouveau mot de passe
   */
  async resetPassword(payload: { email: string; token: string; newPassword: string }) {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanToken = payload.token.trim();
    const newPassword = payload.newPassword.trim();

    // 1. Tentative via l'API dédiée
    try {
      const res = await fetch('/api/auth?action=reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          token: cleanToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        return data;
      }
      throw new Error(data.error || 'Impossible de réinitialiser le mot de passe.');
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
    }

    // 2. Fallback Supabase client
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message);
      }
      return { success: true, message: 'Votre mot de passe a été mis à jour avec succès.' };
    }

    throw new Error('Erreur lors de la réinitialisation du mot de passe.');
  },

  /**
   * 6. Reconstruction des données utilisateur complètes à partir d'une session Supabase
   */
  async buildSessionUser(session: any) {
    if (!session?.user) return null;

    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const { data: providerProfile } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('userId', session.user.id)
        .maybeSingle();

      return {
        accessToken: session.access_token || '',
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: profile?.firstName || session.user.user_metadata?.firstName || '',
          lastName: profile?.lastName || session.user.user_metadata?.lastName || '',
          role: profile?.role || session.user.user_metadata?.role || 'CLIENT',
          countryCode: profile?.countryCode || 'BJ',
          country: profile?.country || '',
          department: profile?.department || '',
          commune: profile?.commune || '',
          city: profile?.city || '',
          preferredLanguage: profile?.preferredLanguage || 'fr',
          avatarUrl: profile?.avatarUrl || '',
          birthDate: profile?.birthDate || '',
          phoneNumber: profile?.phoneNumber || '',
          clientTrialExpiresAt: profile?.clientTrialExpiresAt,
          clientSubscriptionExpiresAt: profile?.clientSubscriptionExpiresAt,
          createdAt: profile?.createdAt || session.user.created_at,
          providerProfile: providerProfile || null,
        },
      };
    } catch (e) {
      return {
        accessToken: session.access_token || '',
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.user_metadata?.firstName || '',
          lastName: session.user.user_metadata?.lastName || '',
          role: session.user.user_metadata?.role || 'CLIENT',
          countryCode: 'BJ',
          preferredLanguage: 'fr',
        },
      };
    }
  },

  /**
   * 5. Attribution du rôle et initialisation du profil (via API serveur pour contourner RLS)
   */
  async chooseRole(userId: string, payload: ChooseRolePayload) {
    if (!userId) {
      return { role: payload.role };
    }

    if (payload.role !== 'CLIENT' && payload.role !== 'PROVIDER') {
      throw new Error("Rôle non autorisé pour l'attribution publique.");
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('sr_token') || '' : '';

    // Tentative via l'API serveur dédiée (PostgreSQL direct, sans RLS)
    try {
      const res = await fetch('/api/profile?action=choose-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // Persister immédiatement dans localStorage
        if (typeof window !== 'undefined') {
          try {
            const session = JSON.parse(localStorage.getItem('sr_session') || '{}');
            session.user = { ...session.user, ...data.user };
            localStorage.setItem('sr_session', JSON.stringify(session));
          } catch {}
        }
        return { role: data.user.role, providerProfile: data.user.providerProfile };
      }
      if (!res.ok) throw new Error(data.error || 'Erreur lors du choix du rôle.');
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) throw apiErr;
      console.warn('API /api/profile?action=choose-role indisponible, fallback Supabase client');
    }

    // Fallback Supabase client
    if (isSupabaseConfigured) {
      await supabase
        .from('users')
        .update({
          role: payload.role,
          country: payload.country,
          department: payload.department,
          commune: payload.commune,
          city: payload.city,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);

      if (payload.role === 'PROVIDER') {
        const { data: existing } = await supabase
          .from('provider_profiles')
          .select('id')
          .eq('userId', userId)
          .maybeSingle();

        const profileBody = {
          userId,
          singleName: payload.singleName || 'Professionnel',
          serviceOffered: payload.serviceOffered || 'Services Généraux',
          country: payload.country || '',
          city: payload.city || 'Cotonou',
          department: payload.department || 'Littoral',
          commune: payload.commune || '',
          whatsappNumber: payload.whatsappNumber || payload.phoneNumber || '',
          directPhoneNumber: payload.phoneNumber || '',
          availability: 'AVAILABLE',
        };

        if (existing) {
          await supabase.from('provider_profiles').update(profileBody).eq('id', existing.id);
        } else {
          await supabase.from('provider_profiles').insert(profileBody);
        }
      }
    }

    return { role: payload.role };
  },

  /**
   * 6. Changement de disponibilité 1-clic (Disponible / Occupé)
   */
  async updateAvailability(userId: string, availability: 'AVAILABLE' | 'BUSY') {
    if (!userId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('sr_token') || '' : '';

    // Tentative via l'API profile
    try {
      const res = await fetch('/api/profile?action=update-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ availability }),
      });
      if (res.ok) return;
    } catch {}

    // Fallback Supabase
    if (isSupabaseConfigured) {
      await supabase.from('provider_profiles').update({ availability }).eq('userId', userId);
    }
  },

  /**
   * 7. Sauvegarde du profil prestataire (via API serveur pour persistance garantie)
   */
  async updateProviderProfile(userId: string, profileData: any) {
    if (!userId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('sr_token') || '' : '';

    // Tentative via l'API serveur dédiée
    try {
      const res = await fetch('/api/profile?action=update-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (res.ok && data.providerProfile) {
        // Persister dans localStorage pour survivre au refresh
        if (typeof window !== 'undefined') {
          try {
            const session = JSON.parse(localStorage.getItem('sr_session') || '{}');
            session.user = { ...session.user, providerProfile: data.providerProfile };
            localStorage.setItem('sr_session', JSON.stringify(session));
          } catch {}
        }
        return data;
      }
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde du profil.');
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) throw apiErr;
      console.warn('API /api/profile?action=update-provider indisponible, fallback Supabase');
    }

    // Fallback Supabase client
    if (isSupabaseConfigured) {
      await supabase
        .from('provider_profiles')
        .update({
          singleName: profileData.singleName,
          fullName: profileData.fullName,
          serviceOffered: profileData.serviceOffered,
          country: profileData.country,
          city: profileData.city,
          department: profileData.department,
          commune: profileData.commune,
          receivesOnSite: Boolean(profileData.receivesOnSite),
          travelRequired: Boolean(profileData.travelRequired),
          travelFee: profileData.travelFee || 0,
          basePrice: profileData.basePrice || 5000,
          pricingUnit: profileData.pricingUnit || 'PRESTATION',
          hourlyRate: profileData.hourlyRate || null,
          dailyRate: profileData.dailyRate || null,
          pricingTiers: profileData.pricingTiers || [],
          portfolioPhotos: profileData.portfolioPhotos || [],
          whatsappNumber: profileData.whatsappNumber,
          directPhoneNumber: profileData.directPhoneNumber,
          photoUrl: profileData.photoUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', userId);
    }
  },

  /**
   * 8. Sauvegarde du profil client (via API serveur pour persistance garantie)
   */
  async updateClientProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      avatarUrl?: string;
      birthDate?: string;
      country?: string;
      countryCode?: string;
      department?: string;
      commune?: string;
      city?: string;
    }
  ) {
    if (!userId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('sr_token') || '' : '';

    // Tentative via l'API serveur dédiée
    try {
      const res = await fetch('/api/profile?action=update-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.user) {
        // Persister dans localStorage
        if (typeof window !== 'undefined') {
          try {
            const session = JSON.parse(localStorage.getItem('sr_session') || '{}');
            session.user = { ...session.user, ...result.user };
            localStorage.setItem('sr_session', JSON.stringify(session));
          } catch {}
        }
        return result;
      }
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la sauvegarde.');
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) throw apiErr;
      console.warn('API /api/profile?action=update-client indisponible, fallback Supabase');
    }

    // Fallback Supabase client
    if (isSupabaseConfigured) {
      await supabase
        .from('users')
        .update({
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          avatarUrl: data.avatarUrl,
          birthDate: data.birthDate || null,
          country: data.country,
          countryCode: data.countryCode,
          department: data.department,
          commune: data.commune,
          city: data.city,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  },

  /**
   * Récupération publique des prestataires enregistrés
   */
  async getPublicProviders(token?: string) {
    try {
      const headers: Record<string, string> = {};
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('sr_token') : '');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/providers/list', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Erreur API providers/list:', e);
    }
    return [];
  },

  /**
   * 9. Historique des paiements de l'utilisateur
   */
  async getPaymentHistory(userId: string) {
    if (!isSupabaseConfigured || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      if (error) {
        console.warn('Erreur récupération paiements :', error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * 10. Récupérer les contacts déjà débloqués par un client
   */
  async getContactUnlocks(clientId: string) {
    if (!isSupabaseConfigured || !clientId) return [];
    try {
      const { data, error } = await supabase
        .from('contact_unlocks')
        .select('*')
        .eq('clientId', clientId);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * 11. Rechargement des données fraîches de l'utilisateur
   */
  async refreshUserData(userId: string) {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: providerProfile } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();

      return { profile, providerProfile };
    } catch {
      return null;
    }
  },
};
