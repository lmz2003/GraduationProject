import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('knowledge_documents')
export class KnowledgeDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  source?: string; // 文档来源（URL、文件路径等）

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // 存储元数据

  @Column({ nullable: true })
  vectorId?: string; // Milvus 中的向量 ID

  @Column({ default: 'text' })
  documentType!: string; // text, pdf, markdown 等

  @Column({ default: false })
  isProcessed!: boolean; // 是否已处理为向量

  @ManyToOne(() => User, { nullable: false })
  owner!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}