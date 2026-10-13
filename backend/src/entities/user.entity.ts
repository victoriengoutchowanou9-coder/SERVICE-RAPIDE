import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../common/enums';
import { ProviderProfile } from './provider-profile.entity';
import { ContactUnlock } from './contact-unlock.entity';
import { Payment } from './payment.entity';
import { RefundRequest } from './refund-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PENDING,
  })
  role: UserRole;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatarUrl: string; // Photo de profil utilisateur (Client / Prestataire)

  @Column({ default: 'SN' })
  countryCode: string; // Ex: BJ, CI, SN, CM...

  @Column({ default: 'fr' })
  preferredLanguage: string; // Ex: fr, en, ar, pt, sw

  // Pour les clients : fin de la période d'essai gratuit (1 semaine offerte)
  @Column({ type: 'timestamp', nullable: true })
  clientTrialExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => ProviderProfile, (profile) => profile.user, { cascade: true })
  providerProfile: ProviderProfile;

  @OneToMany(() => ContactUnlock, (unlock) => unlock.client)
  contactUnlocks: ContactUnlock[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => RefundRequest, (refund) => refund.client)
  refundRequests: RefundRequest[];
}
