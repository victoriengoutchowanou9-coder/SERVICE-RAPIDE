import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('advertisements')
export class Advertisement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  targetUrl: string;

  @Column({ nullable: true })
  targetCountryCode: string; // Ciblage par pays africain ou 'ALL'

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  clicksCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
