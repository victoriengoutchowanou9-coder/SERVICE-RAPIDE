import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { UserRole, RefundStatus } from '../../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', [UserRole.ADMIN])
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 6. Tableau de bord principal
   */
  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('providers')
  getProviders() {
    return this.adminService.getAllProviders();
  }

  @Get('payments')
  getPayments() {
    return this.adminService.getAllPayments();
  }

  /**
   * 4. & 6. Demandes de remboursement
   */
  @Get('refund-requests')
  getRefundRequests(@Query('status') status?: RefundStatus) {
    return this.adminService.getRefundRequests(status);
  }

  @Post('refund-requests/:id/process')
  processRefund(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; comment?: string },
  ) {
    return this.adminService.processRefundRequest(
      req.user.id,
      id,
      body.action,
      body.comment,
    );
  }

  /**
   * 6. Gestion des prix et périodes d'essai
   */
  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings/:key')
  updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.adminService.updateSetting(key, value);
  }
}
