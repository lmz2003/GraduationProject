import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Note } from './note.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class NoteVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => Note, (note) => note.versions, { nullable: false })
  note!: Note;

  @ManyToOne(() => User, { nullable: false })
  updatedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
