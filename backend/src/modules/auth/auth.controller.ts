import { Controller, Post, Body, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto, ChooseRoleDto, UpdateUserPreferencesDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AFRICAN_COUNTRIES, SUPPORTED_LANGUAGES } from '../../common/constants/countries';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 1. AUTHENTIFICATION: Une seule interface de connexion et d'inscription réunies
   */
  @Post('login-or-register')
  async loginOrRegister(@Body() dto: AuthCredentialsDto) {
    return this.authService.authenticateOrRegister(dto);
  }

  /**
   * 1. Après l'inscription, l'utilisateur choisit son rôle : Client ou Prestataire
   */
  @UseGuards(JwtAuthGuard)
  @Post('choose-role')
  async chooseRole(@Request() req, @Body() dto: ChooseRoleDto) {
    return this.authService.chooseRole(req.user.id, dto);
  }

  /**
   * 1. Section de choix de la langue et du pays
   */
  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  async updatePreferences(@Request() req, @Body() dto: UpdateUserPreferencesDto) {
    return this.authService.updatePreferences(req.user.id, dto);
  }

  /**
   * Profil utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  /**
   * Référentiel des pays africains et langues supportées
   */
  @Get('meta-geo')
  getMetaGeo() {
    return {
      countries: AFRICAN_COUNTRIES,
      languages: SUPPORTED_LANGUAGES,
    };
  }
}
