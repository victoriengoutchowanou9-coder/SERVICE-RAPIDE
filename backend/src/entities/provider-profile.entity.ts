import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AvailabilityStatus } from '../common/enums';
import { User } from './user.entity';
import { ContactUnlock } from './contact-unlock.entity';

@Entity('provider_profiles')
export class ProviderProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.providerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Règle d'or Client : « dans la liste : un seul nom du prestataire (pas le nom complet) »
  @Column()
  singleName: string; // Ex: "Mamadou" ou "Jean" ou "Fatou"

  @Column({ nullable: true })
  fullName: string; // Nom complet réel du prestataire

  @Column({ nullable: true })
  photoUrl: string; // Photo de profil du prestataire

  @Column()
  serviceOffered: string; // Ex: Plomberie, Électricité, Coiffure, Climatisation, etc.

  @Column()
  city: string; // Ex: Abidjan, Cotonou, Dakar, Douala, Bamako

  @Column()
  department: string; // Département / Commune / Région

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.AVAILABLE,
  })
  availability: AvailabilityStatus; // Modifiable en un clic (Disponible / Occupé)

  @Column({ default: true })
  receivesOnSite: boolean; // Reçoit sur place : Oui / Non

  @Column({ default: false })
  travelRequired: boolean; // Déplacement nécessaire : Oui / Non

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  travelFee: number; // Frais de déplacement à préciser si travelRequired est Oui

  // Tarif de prestation (visible par les clients avant contact)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5000 })
  basePrice: number; // Ex: 5000, 10000 FCFA

  @Column({ default: 'par prestation' })
  pricingUnit: string; // Ex: 'par prestation', 'par heure', 'par jour', 'sur devis à partir de'

  @Column({ nullable: true })
  whatsappNumber: string; // WhatsApp pour contacter le prestataire

  @Column({ nullable: true })
  directPhoneNumber: string; // Téléphone direct

  // Abonnement prestataire : 5000 FCFA avec 1 mois gratuit à l'inscription
  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: true })
  isTrialUsed: boolean; // Si le 1er mois gratuit a déjà été appliqué

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ContactUnlock, (unlock) => unlock.provider)
  unlocks: ContactUnlock[];
}
