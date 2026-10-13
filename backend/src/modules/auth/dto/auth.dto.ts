import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit comporter au moins 6 caractères' })
  password: string;

  @IsOptional()
  @IsString()
  countryCode?: string; // Ex: 'SN', 'CI', 'BJ', 'CM'

  @IsOptional()
  @IsString()
  preferredLanguage?: string; // Ex: 'fr', 'en', 'ar', 'pt', 'sw'
}

export class ChooseRoleDto {
  @IsNotEmpty({ message: 'Le rôle est requis' })
  role: 'CLIENT' | 'PROVIDER';

  // Si le rôle est PRESTATAIRE, champs initiaux du profil
  @IsOptional()
  @IsString()
  singleName?: string; // Un seul nom visible

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
