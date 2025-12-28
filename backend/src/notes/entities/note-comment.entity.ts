import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Note } from './note.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class NoteComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Note, (note) => note.comments, { nullable: false })
  note!: Note;

  @ManyToOne(() => User, { nullable: false })
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
