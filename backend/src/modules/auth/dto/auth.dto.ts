import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
  Matches,
  Length,
} from 'class-validator';

export class AuthCredentialsDto {
  // Contrôle strict côté serveur du format email
  @IsNotEmpty({ message: "L'adresse email est requise." })
  @IsEmail(
    { allow_utf8_local_part: false, require_tld: true },
    { message: 'Format email invalide. Veuillez fournir une adresse email valide (ex: utilisateur@domaine.com).' },
  )
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: "Le format de l'adresse email n'est pas conforme.",
  })
  email: string;

  // Contrôle strict côté serveur de la taille du mot de passe (8 caractères minimum)
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  @MinLength(8, {
    message: 'Le mot de passe doit comporter au moins 8 caractères.',
  })
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: 'Format email invalide' })
  email: string;

  @IsNotEmpty({ message: 'Le code OTP est requis' })
  @Length(6, 6, { message: 'Le code OTP doit comporter exactement 6 chiffres' })
  @Matches(/^[0-9]{6}$/, { message: 'Le code OTP doit être composé de 6 chiffres' })
  otp: string;
}

export class ResendOtpDto {
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: 'Format email invalide' })
  email: string;
}

export class ChooseRoleDto {
  @IsNotEmpty({ message: 'Le rôle est requis' })
  role: 'CLIENT' | 'PROVIDER';

  @IsOptional()
  @IsString()
  singleName?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  serviceOffered?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
