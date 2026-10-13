import { IsNotEmpty, IsEnum, IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AvailabilityStatus } from '../../../common/enums';

export class UpdateAvailabilityDto {
  @IsNotEmpty()
  @IsEnum(AvailabilityStatus)
  availability: AvailabilityStatus; // AVAILABLE ou BUSY
}

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  singleName?: string; // Nom unique visible

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
  @IsBoolean()
  receivesOnSite?: boolean;

  @IsOptional()
  @IsBoolean()
  travelRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  travelFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsString()
  pricingUnit?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  directPhoneNumber?: string;
}
