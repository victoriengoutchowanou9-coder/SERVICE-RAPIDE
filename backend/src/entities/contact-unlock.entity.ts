import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { ProviderProfile } from './provider-profile.entity';
import { Payment } from './payment.entity';
import { RefundRequest } from './refund-request.entity';

@Entity('contact_unlocks')
export class ContactUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.contactUnlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => ProviderProfile, (profile) => profile.unlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: ProviderProfile;

  @Column()
  providerId: string;

  @OneToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ default: false })
  isUnlockedViaTrial: boolean; // Si débloqué grâce à la semaine gratuite client

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => RefundRequest, (refund) => refund.unlock, { cascade: true })
  refundRequest: RefundRequest;
}
