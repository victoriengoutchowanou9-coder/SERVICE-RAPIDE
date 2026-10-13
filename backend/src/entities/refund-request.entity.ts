import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { RefundStatus } from '../common/enums';
import { User } from './user.entity';
import { ContactUnlock } from './contact-unlock.entity';

@Entity('refund_requests')
export class RefundRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.refundRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  clientId: string;

  @OneToOne(() => ContactUnlock, (unlock) => unlock.refundRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unlockId' })
  unlock: ContactUnlock;

  @Column()
  unlockId: string;

  @Column('text')
  reason: string; // Motif de la demande de remboursement

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING, // Toujours validation manuelle par admin
  })
  status: RefundStatus;

  @Column({ nullable: true })
  adminComment: string; // Motif d'acceptation ou refus par l'admin

  @Column({ nullable: true })
  reviewedByAdminId: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
