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
  { code: 'CF', nameFr: 'Centrafrique', nameEn: 'Central African Republic', dialCode: '+236', currency: 'XAF', flag: '🇨🇫' },
  { code: 'RW', nameFr: 'Rwanda', nameEn: 'Rwanda', dialCode: '+250', currency: 'RWF', flag: '🇷🇼' },
  { code: 'BI', nameFr: 'Burundi', nameEn: 'Burundi', dialCode: '+257', currency: 'BIF', flag: '🇧🇮' },
  { code: 'MR', nameFr: 'Mauritanie', nameEn: 'Mauritania', dialCode: '+222', currency: 'MRU', flag: '🇲🇷' },
  { code: 'GH', nameFr: 'Ghana', nameEn: 'Ghana', dialCode: '+233', currency: 'GHS', flag: '🇬🇭' },
  { code: 'NG', nameFr: 'Nigeria', nameEn: 'Nigeria', dialCode: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', nameFr: 'Kenya', nameEn: 'Kenya', dialCode: '+254', currency: 'KES', flag: '🇰🇪' },
  { code: 'TZ', nameFr: 'Tanzanie', nameEn: 'Tanzania', dialCode: '+255', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', nameFr: 'Ouganda', nameEn: 'Uganda', dialCode: '+256', currency: 'UGX', flag: '🇺🇬' },
  { code: 'ZA', nameFr: 'Afrique du Sud', nameEn: 'South Africa', dialCode: '+27', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'MA', nameFr: 'Maroc', nameEn: 'Morocco', dialCode: '+212', currency: 'MAD', flag: '🇲🇦' },
  { code: 'DZ', nameFr: 'Algérie', nameEn: 'Algeria', dialCode: '+213', currency: 'DZD', flag: '🇩🇿' },
  { code: 'TN', nameFr: 'Tunisie', nameEn: 'Tunisia', dialCode: '+216', currency: 'TND', flag: '🇹🇳' },
  { code: 'EG', nameFr: 'Égypte', nameEn: 'Egypt', dialCode: '+20', currency: 'EGP', flag: '🇪🇬' },
  { code: 'AO', nameFr: 'Angola', nameEn: 'Angola', dialCode: '+244', currency: 'AOA', flag: '🇦🇴' },
  { code: 'MZ', nameFr: 'Mozambique', nameEn: 'Mozambique', dialCode: '+258', currency: 'MZN', flag: '🇲🇿' },
  { code: 'ZM', nameFr: 'Zambie', nameEn: 'Zambia', dialCode: '+260', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'ZW', nameFr: 'Zimbabwe', nameEn: 'Zimbabwe', dialCode: '+263', currency: 'ZWL', flag: '🇿🇼' },
  { code: 'BW', nameFr: 'Botswana', nameEn: 'Botswana', dialCode: '+267', currency: 'BWP', flag: '🇧🇼' },
  { code: 'NA', nameFr: 'Namibie', nameEn: 'Namibia', dialCode: '+264', currency: 'NAD', flag: '🇳🇦' },
  { code: 'ET', nameFr: 'Éthiopie', nameEn: 'Ethiopia', dialCode: '+251', currency: 'ETB', flag: '🇪🇹' },
  { code: 'SL', nameFr: 'Sierra Leone', nameEn: 'Sierra Leone', dialCode: '+232', currency: 'SLE', flag: '🇸🇱' },
  { code: 'LR', nameFr: 'Libéria', nameEn: 'Liberia', dialCode: '+231', currency: 'LRD', flag: '🇱🇷' },
  { code: 'GM', nameFr: 'Gambie', nameEn: 'Gambia', dialCode: '+220', currency: 'GMD', flag: '🇬🇲' },
  { code: 'GW', nameFr: 'Guinée-Bissau', nameEn: 'Guinea-Bissau', dialCode: '+245', currency: 'XOF', flag: '🇬🇼' },
  { code: 'CV', nameFr: 'Cap-Vert', nameEn: 'Cape Verde', dialCode: '+238', currency: 'CVE', flag: '🇨🇻' },
  { code: 'KM', nameFr: 'Comores', nameEn: 'Comoros', dialCode: '+269', currency: 'KMF', flag: '🇰🇲' },
  { code: 'DJ', nameFr: 'Djibouti', nameEn: 'Djibouti', dialCode: '+253', currency: 'DJF', flag: '🇩🇯' },
  { code: 'GQ', nameFr: 'Guinée Équatoriale', nameEn: 'Equatorial Guinea', dialCode: '+240', currency: 'XAF', flag: '🇬🇶' },
  { code: 'ER', nameFr: 'Érythrée', nameEn: 'Eritrea', dialCode: '+291', currency: 'ERN', flag: '🇪🇷' },
  { code: 'SZ', nameFr: 'Eswatini', nameEn: 'Eswatini', dialCode: '+268', currency: 'SZL', flag: '🇸🇿' },
  { code: 'LS', nameFr: 'Lesotho', nameEn: 'Lesotho', dialCode: '+266', currency: 'LSL', flag: '🇱🇸' },
  { code: 'LY', nameFr: 'Libye', nameEn: 'Libya', dialCode: '+218', currency: 'LYD', flag: '🇱🇾' },
  { code: 'MW', nameFr: 'Malawi', nameEn: 'Malawi', dialCode: '+265', currency: 'MWK', flag: '🇲🇼' },
  { code: 'MU', nameFr: 'Maurice', nameEn: 'Mauritius', dialCode: '+230', currency: 'MUR', flag: '🇲🇺' },
  { code: 'ST', nameFr: 'Sao Tomé-et-Principe', nameEn: 'Sao Tome and Principe', dialCode: '+239', currency: 'STN', flag: '🇸🇹' },
  { code: 'SC', nameFr: 'Seychelles', nameEn: 'Seychelles', dialCode: '+248', currency: 'SCR', flag: '🇸🇨' },
  { code: 'SO', nameFr: 'Somalie', nameEn: 'Somalia', dialCode: '+252', currency: 'SOS', flag: '🇸🇴' },
  { code: 'SS', nameFr: 'Soudan du Sud', nameEn: 'South Sudan', dialCode: '+211', currency: 'SSP', flag: '🇸🇸' },
  { code: 'SD', nameFr: 'Soudan', nameEn: 'Sudan', dialCode: '+249', currency: 'SDG', flag: '🇸🇩' }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية (Arabe)', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' }
];
