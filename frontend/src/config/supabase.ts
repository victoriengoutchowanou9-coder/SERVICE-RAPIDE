import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour le Frontend (compatible Vite et Vercel/Next)
export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://gsgbvoyddagpjldgeyqk.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
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
  preferredLanguage?: string;
}

export interface ChooseRolePayload {
  role: 'CLIENT' | 'PROVIDER';
  singleName?: string;
  serviceOffered?: string;
  city?: string;
  department?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export const supabaseBackend = {
  /**
   * 1. Authentification unifiée (Connexion ou Inscription automatique)
   */
  async loginOrRegister(payload: AuthPayload) {
    if (!isSupabaseConfigured) {
      throw new Error("Configuration Supabase manquante : veuillez renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
    }

    const email = payload.email.toLowerCase().trim();
    const password = payload.password || 'serviceRapide2025!';

    // Tentative de connexion
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData?.user) {
      // Utilisateur existant connecté
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

      return {
        accessToken: signInData.session?.access_token || '',
        isNewUser: false,
        requiresOtp: false,
        message: 'Connexion réussie',
        user: {
          id: signInData.user.id,
          email: signInData.user.email,
          role: profile?.role || 'PENDING',
          countryCode: profile?.countryCode || payload.countryCode || 'CI',
          preferredLanguage: profile?.preferredLanguage || 'fr',
          providerProfile: providerProfile || null,
        },
      };
    }

    // Inscription automatique si l'utilisateur n'existe pas
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phoneNumber: payload.phoneNumber,
          countryCode: payload.countryCode || 'CI',
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
      requiresOtp: !session, // Si confirmation d'email activée sur Supabase
      message: !session
        ? 'Un code de confirmation a été envoyé à votre adresse email.'
        : 'Compte créé avec succès',
      user: {
        id: user?.id || '',
        email: user?.email || email,
        role: 'PENDING',
        countryCode: payload.countryCode || 'CI',
        preferredLanguage: payload.preferredLanguage || 'fr',
      },
    };
  },

  /**
   * 2. Validation du code OTP
   */
  async verifyOtp(email: string, otp: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Configuration Supabase manquante.");
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'signup',
    });

    if (error) {
      // Essai en type 'email' si non 'signup'
      const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'email',
      });
      if (retryError) throw new Error(retryError.message);
      return retryData;
    }

    return data;
  },

  /**
   * 3. Renvoyer un code OTP
   */
  async resendOtp(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Configuration Supabase manquante.");
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });

    if (error) throw new Error(error.message);
    return { message: 'Nouveau code OTP envoyé par email' };
  },

  /**
   * 4. Sélection du rôle et initialisation du profil
   */
  async chooseRole(userId: string, payload: ChooseRolePayload) {
    if (!isSupabaseConfigured || !userId) {
      return { role: payload.role };
    }

    // 1. Mettre à jour le rôle dans public.users
    await supabase
      .from('users')
      .update({ role: payload.role })
      .eq('id', userId);

    // 2. Si PRESTATAIRE, créer ou mettre à jour le profil prestataire
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
        city: payload.city || 'Abidjan',
        department: payload.department || 'Centre',
        whatsappNumber: payload.whatsappNumber || payload.phoneNumber || '',
        directPhoneNumber: payload.phoneNumber || '',
        availability: 'AVAILABLE',
      };

      if (existing) {
        await supabase
          .from('provider_profiles')
          .update(profileBody)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('provider_profiles')
          .insert(profileBody);
      }
    }

    return { role: payload.role };
  },

  /**
   * 5. Changement de disponibilité 1-clic (Disponible / Occupé)
   */
  async updateAvailability(userId: string, availability: 'AVAILABLE' | 'BUSY') {
    if (!isSupabaseConfigured || !userId) return;

    await supabase
      .from('provider_profiles')
      .update({ availability })
      .eq('userId', userId);
  },

  /**
   * 6. Sauvegarde du profil prestataire
   */
  async updateProviderProfile(userId: string, profileData: any) {
    if (!isSupabaseConfigured || !userId) return;

    await supabase
      .from('provider_profiles')
      .update({
        singleName: profileData.singleName,
        fullName: profileData.fullName,
        serviceOffered: profileData.serviceOffered,
        city: profileData.city,
        department: profileData.department,
        receivesOnSite: profileData.receivesOnSite,
        travelRequired: profileData.travelRequired,
        travelFee: profileData.travelFee,
        basePrice: profileData.basePrice,
        pricingUnit: profileData.pricingUnit,
        whatsappNumber: profileData.whatsappNumber,
        directPhoneNumber: profileData.directPhoneNumber,
        photoUrl: profileData.photoUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', userId);
  },
};
