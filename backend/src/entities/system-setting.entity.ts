import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Clé unique du paramètre (ex: PROVIDER_SUBSCRIPTION_PRICE, CLIENT_CONTACT_PRICE)
  @Column({ unique: true })
  settingKey: string;

  @Column()
  settingValue: string;

  @Column({ nullable: true })
  description: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
