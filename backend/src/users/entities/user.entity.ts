import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  phoneNumber!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar?: string;

  @OneToMany('Note', (note: any) => note.owner)
  notes!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
