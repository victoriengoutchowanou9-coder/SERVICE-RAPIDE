import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthCredentialsDto,
  ChooseRoleDto,
  UpdateUserPreferencesDto,
  VerifyOtpDto,
  ResendOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AFRICAN_COUNTRIES, SUPPORTED_LANGUAGES } from '../../common/constants/countries';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 1. Interface de connexion & Inscription (avec Rate Limiting 4 req/min/IP)
   */
  @Post('login-or-register')
  async loginOrRegister(@Body() dto: AuthCredentialsDto) {
    return this.authService.authenticateOrRegister(dto);
  }

  /**
   * 2. Validation OTP (Activation du compte)
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * 3. Renvoyer un code OTP
   */
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  /**
   * 4. Choix du rôle après inscription
   */
  @UseGuards(JwtAuthGuard)
  @Post('choose-role')
  async chooseRole(@Request() req, @Body() dto: ChooseRoleDto) {
    return this.authService.chooseRole(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  async updatePreferences(@Request() req, @Body() dto: UpdateUserPreferencesDto) {
    return this.authService.updatePreferences(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  @Get('meta-geo')
  getMetaGeo() {
    return {
      countries: AFRICAN_COUNTRIES,
      languages: SUPPORTED_LANGUAGES,
    };
  }
}
