import { IsOptional, IsString } from 'class-validator';

export class FilterProvidersDto {
  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class RequestRefundDto {
  @IsOptional()
  @IsString()
  reason: string;
}
