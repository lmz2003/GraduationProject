import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NoteVersion } from './note-version.entity';
import { NoteComment } from './note-comment.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  summary?: string;

  @Column('simple-array', { nullable: true, default: '' })
  tags!: string[];

  @Column({ default: 'draft' })
  status!: string;

  @Column({ default: false })
  deleted!: boolean;

  @Column({ default: false })
  isPublic!: boolean;

  @ManyToOne(() => User, (user) => user.notes, { nullable: false })
  owner!: User;

  @OneToMany(() => NoteVersion, (version) => version.note, { cascade: true })
  versions!: NoteVersion[];

  @OneToMany(() => NoteComment, (comment) => comment.note, { cascade: true })
  comments!: NoteComment[];

  @Column({ nullable: true })
  knowledgeDocumentId?: string;

  @Column({ type: 'timestamp', nullable: true })
  syncedToKnowledgeAt?: Date;

  @Column({ default: false })
  needsSync!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
