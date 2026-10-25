export interface AfricanCountry {
  code: string;
  nameFr: string;
  nameEn: string;
  dialCode: string;
  currency: string;
  flag: string;
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { code: 'BJ', nameFr: 'Bénin', nameEn: 'Benin', dialCode: '+229', currency: 'XOF', flag: '🇧🇯' },
  { code: 'BF', nameFr: 'Burkina Faso', nameEn: 'Burkina Faso', dialCode: '+226', currency: 'XOF', flag: '🇧🇫' },
  { code: 'CI', nameFr: "Côte d'Ivoire", nameEn: "Ivory Coast", dialCode: '+225', currency: 'XOF', flag: '🇨🇮' },
  { code: 'SN', nameFr: 'Sénégal', nameEn: 'Senegal', dialCode: '+221', currency: 'XOF', flag: '🇸🇳' },
  { code: 'CM', nameFr: 'Cameroun', nameEn: 'Cameroon', dialCode: '+237', currency: 'XAF', flag: '🇨🇲' },
  { code: 'TG', nameFr: 'Togo', nameEn: 'Togo', dialCode: '+228', currency: 'XOF', flag: '🇹🇬' },
  { code: 'ML', nameFr: 'Mali', nameEn: 'Mali', dialCode: '+223', currency: 'XOF', flag: '🇲🇱' },
  { code: 'NE', nameFr: 'Niger', nameEn: 'Niger', dialCode: '+227', currency: 'XOF', flag: '🇳🇪' },
  { code: 'GN', nameFr: 'Guinée', nameEn: 'Guinea', dialCode: '+224', currency: 'GNF', flag: '🇬🇳' },
  { code: 'GA', nameFr: 'Gabon', nameEn: 'Gabon', dialCode: '+241', currency: 'XAF', flag: '🇬🇦' },
  { code: 'CG', nameFr: 'Congo', nameEn: 'Congo', dialCode: '+242', currency: 'XAF', flag: '🇨🇬' },
  { code: 'CD', nameFr: 'RDC', nameEn: 'DR Congo', dialCode: '+243', currency: 'CDF', flag: '🇨🇩' },
  { code: 'MG', nameFr: 'Madagascar', nameEn: 'Madagascar', dialCode: '+261', currency: 'MGA', flag: '🇲🇬' },
  { code: 'TD', nameFr: 'Tchad', nameEn: 'Chad', dialCode: '+235', currency: 'XAF', flag: '🇹🇩' },
  { code: 'RW', nameFr: 'Rwanda', nameEn: 'Rwanda', dialCode: '+250', currency: 'RWF', flag: '🇷🇼' },
  { code: 'GH', nameFr: 'Ghana', nameEn: 'Ghana', dialCode: '+233', currency: 'GHS', flag: '🇬🇭' },
  { code: 'NG', nameFr: 'Nigeria', nameEn: 'Nigeria', dialCode: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', nameFr: 'Kenya', nameEn: 'Kenya', dialCode: '+254', currency: 'KES', flag: '🇰🇪' },
  { code: 'MA', nameFr: 'Maroc', nameEn: 'Morocco', dialCode: '+212', currency: 'MAD', flag: '🇲🇦' },
  { code: 'DZ', nameFr: 'Algérie', nameEn: 'Algeria', dialCode: '+213', currency: 'DZD', flag: '🇩🇿' },
  { code: 'TN', nameFr: 'Tunisie', nameEn: 'Tunisia', dialCode: '+216', currency: 'TND', flag: '🇹🇳' },
  { code: 'ZA', nameFr: 'Afrique du Sud', nameEn: 'South Africa', dialCode: '+27', currency: 'ZAR', flag: '🇿🇦' },
];

export const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
];

export interface ReviewItem {
  id: string;
  clientName: string;
  rating: number; // 1 à 5
  comment: string;
  date: string;
}

export interface ProviderItem {
  id: string;
  singleName: string;
  photoUrl?: string; // Photo de profil du prestataire
  serviceOffered: string;
  skills?: string[]; // Compétences détaillées
  city: string;
  department: string;
  interventionZones?: string[]; // Zones d'intervention précises
  availability: 'AVAILABLE' | 'BUSY';
  isOnline?: boolean;
  receivesOnSite: boolean;
  travelRequired: boolean;
  travelFee: number;
  // Tarif estimé
  basePrice: number;
  pricingUnit: string;
  // Réputation & Activité
  rating: number; // Ex: 4.9
  reviewsCount: number;
  completedMissions: number; // Nombre de missions réalisées
  reviews?: ReviewItem[];
  // Contact
  isContactUnlocked: boolean;
  unlockId: string | null;
  refundStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  contact: {
    directPhone: string;
    whatsappNumber: string;
    fullName?: string;
  };
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAvatar?: string;
  providerId: string;
  providerSingleName: string;
  serviceTitle: string;
  description: string;
  mode: 'IMMEDIATE' | 'SCHEDULED'; // Maintenant ou Programmer
  scheduledDateTime?: string; // Si programmé
  location: string;
  estimatedPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'PAID';
  paymentMethod?: string;
  createdAt: string;
  hasBeenRated?: boolean;
}

export interface ClientItem {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  city: string;
  countryCode: string;
  isOnline: boolean;
  lastActive: string;
  interests?: string;
}

export interface PostItem {
  id: string;
  authorId: string;
  authorSingleName: string;
  authorPhotoUrl?: string;
  authorService: string;
  city: string;
  department?: string;
  mapLocationHint?: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  createdAt: string;
}

export interface AdItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  targetUrl?: string;
  advertiser: string;
  tag: string;
  durationWeeks?: number;
  amountPaid?: number;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT';
  userId?: string;
}
