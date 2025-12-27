import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  @Index('IDX_email', ['email'])
  email: string;

  @Column({ unique: true })
  @Index('IDX_username', ['username'], { unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ nullable: true, name: 'refreshToken' })
  refreshToken: string;

  @Column({ nullable: true, name: 'refreshTokenExpiresAt', type: 'timestamp' })
  refreshTokenExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

