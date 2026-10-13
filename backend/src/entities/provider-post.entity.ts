import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('provider_posts')
export class ProviderPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @Column()
  authorSingleName: string;

  @Column({ nullable: true })
  authorPhotoUrl: string;

  @Column()
  authorService: string;

  @Column()
  city: string;

  @Column({ default: '' })
  department: string; // Précision de la localisation (ex: Cocody, Bonapriso, Akpakpa)

  @Column({ nullable: true })
  mapLocationHint: string; // Ex: "À 2.5 km de votre position", "Zone Riviera Palmeraie"

  @Column('text')
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  likesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
