import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('knowledge_documents')
export class KnowledgeDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  source?: string; // 文档来源（URL、文件路径、原始文件名等）

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // 存储元数据

  @Column({ nullable: true })
  vectorId?: string; // Milvus 中的向量 ID

  @Column({ default: 'text' })
  documentType!: string; // text, pdf, markdown, docx, xlsx, csv, json 等

  @Column({ default: false })
  isProcessed!: boolean; // 是否已处理为向量

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'uploaded',
    comment: 'uploaded=已上传待处理, processing=处理中, processed=已处理, failed=处理失败'
  })
  status!: string; // 文档状态: uploaded | processing | processed | failed

  @Column({ nullable: true })
  processingError?: string; // 处理错误信息

  @Column({ type: 'varchar', length: 100 })
  ownerId!: string; // 用户ID，存储字符串类型

  // 文件相关字段
  @Column({ nullable: true })
  fileName?: string; // 原始文件名

  @Column({ nullable: true })
  fileSize?: number; // 文件大小（字节）

  @Column({ nullable: true })
  fileMimeType?: string; // 文件 MIME 类型（application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document 等）

  @Column({ nullable: true })
  fileUrl?: string; // 服务器上保存的文件路径

  @Column({ default: 'input' })
  uploadType!: string; // input（文本输入）或 file（文件上传）

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}