import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Note } from './entities/note.entity';
import { NoteVersion } from './entities/note-version.entity';
import { NoteComment } from './entities/note-comment.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { UsersService } from '../users/users.service';
import { KnowledgeBaseService } from '../knowledge-base/services/knowledge-base.service';
import { CreateDocumentDto } from '../knowledge-base/dto/create-document.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private noteRepository: Repository<Note>,
    @InjectRepository(NoteVersion) private noteVersionRepository: Repository<NoteVersion>,
    @InjectRepository(NoteComment) private noteCommentRepository: Repository<NoteComment>,
    private readonly usersService: UsersService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  // Create a new note
  async createNote(createNoteDto: CreateNoteDto, ownerId: string): Promise<Note> {
    const owner = await this.usersService.getUserById(ownerId);

    // 如果没有提供标题，使用默认值
    const title = createNoteDto.title || '未命名笔记';
    
    // 如果没有提供摘要，自动生成（取内容前100个字符）
    const summary = createNoteDto.summary || 
      (createNoteDto.content.length > 100 
        ? createNoteDto.content.substring(0, 100) + '...' 
        : createNoteDto.content);

    const note = this.noteRepository.create({
      ...createNoteDto,
      title,
      summary,
      tags: createNoteDto.tags || [],
      status: createNoteDto.status || 'draft',
      owner,
    });

    const savedNote = await this.noteRepository.save(note);

    // Create initial version
    await this.noteVersionRepository.save({
      content: savedNote.content,
      title: savedNote.title,
      description: savedNote.description,
      note: savedNote,
      updatedBy: owner,
    });

    return savedNote;
  }

  // Get all notes for a user with query filters
  async getNotesByUserId(
    userId: string,
    queryDto?: QueryNotesDto,
  ): Promise<{ list: Note[]; pagination: { page: number; pageSize: number; total: number } }> {
    const page = queryDto?.page || 1;
    const pageSize = queryDto?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const whereConditions: any = {
      owner: { id: userId },
      deleted: false,
    };

    // 关键字搜索（标题）
    if (queryDto?.keyword) {
      whereConditions.title = Like(`%${queryDto.keyword}%`);
    }

    // 状态筛选
    if (queryDto?.status) {
      whereConditions.status = queryDto.status;
    }

    // 标签筛选（简单实现，检查标签数组是否包含指定标签）
    // 注意：这里使用 Like 可能不够精确，生产环境建议用更复杂的查询
    if (queryDto?.tag) {
      whereConditions.tags = Like(`%${queryDto.tag}%`);
    }

    // 排序
    const sortBy = queryDto?.sortBy || 'updatedAt';
    const order = queryDto?.order || 'desc';
    const orderOption: any = {};
    orderOption[sortBy] = order.toUpperCase();

    // 查询
    const [list, total] = await this.noteRepository.findAndCount({
      where: whereConditions,
      relations: ['owner'],
      order: orderOption,
      skip,
      take: pageSize,
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  }

  // Get a single note by id
  async getNoteById(noteId: string): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['owner', 'versions', 'comments', 'comments.author'],
    });
    if (!note) {
      throw new NotFoundException(`Note with id ${noteId} not found`);
    }
    return note;
  }

  // Update a note
  async updateNote(noteId: string, updateNoteDto: UpdateNoteDto, userId: string): Promise<Note> {
    const note = await this.getNoteById(noteId);
    const user = await this.usersService.getUserById(userId);

    // 如果更新了内容但没有提供摘要，自动生成摘要
    let summary = updateNoteDto.summary;
    if (updateNoteDto.content && !summary) {
      summary = updateNoteDto.content.length > 100
        ? updateNoteDto.content.substring(0, 100) + '...'
        : updateNoteDto.content;
    }

    // 检查是否需要标记为需要同步
    let needsSync = note.needsSync;
    if (note.knowledgeDocumentId && (updateNoteDto.content || updateNoteDto.title)) {
      needsSync = true;
    }

    // Update note
    const updatedNote = await this.noteRepository.save({
      ...note,
      ...updateNoteDto,
      summary: summary || note.summary,
      needsSync,
    });

    // Create new version
    await this.noteVersionRepository.save({
      content: updatedNote.content,
      title: updatedNote.title,
      description: updatedNote.description,
      note: updatedNote,
      updatedBy: user,
    });

    return updatedNote;
  }

  // Update note content (for real-time editing)
  async updateNoteContent(noteId: string, content: string, title: string, userId: string): Promise<Note> {
    const note = await this.getNoteById(noteId);
    const user = await this.usersService.getUserById(userId);

    // 检查是否需要标记为需要同步
    let needsSync = note.needsSync;
    if (note.knowledgeDocumentId && (content !== note.content || title !== note.title)) {
      needsSync = true;
    }

    // Update note
    const updatedNote = await this.noteRepository.save({
      ...note,
      content,
      title,
      needsSync,
    });

    // Create new version
    await this.noteVersionRepository.save({
      content,
      title,
      description: note.description,
      note: updatedNote,
      updatedBy: user,
    });

    return updatedNote;
  }

  // Delete a note (逻辑删除)
  async deleteNote(noteId: string, userId: string): Promise<void> {
    const note = await this.getNoteById(noteId);
    
    // 权限校验
    if (note.owner.id !== userId) {
      throw new NotFoundException(`Note with id ${noteId} not found`);
    }
    
    // 逻辑删除
    note.deleted = true;
    await this.noteRepository.save(note);
  }

  // Batch delete notes (逻辑删除)
  async batchDeleteNotes(noteIds: string[], userId: string): Promise<{ successIds: string[]; failedIds: string[] }> {
    const successIds: string[] = [];
    const failedIds: string[] = [];

    for (const noteId of noteIds) {
      try {
        await this.deleteNote(noteId, userId);
        successIds.push(noteId);
      } catch (error) {
        failedIds.push(noteId);
      }
    }

    return { successIds, failedIds };
  }

  // Get note versions
  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    return this.noteVersionRepository.find({
      where: { note: { id: noteId } },
      relations: ['updatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // Restore note from a version
  async restoreNoteFromVersion(noteId: string, versionId: string, userId: string): Promise<Note> {
    const note = await this.getNoteById(noteId);
    const version = await this.noteVersionRepository.findOne({
      where: { id: versionId, note: { id: noteId } },
    });
    if (!version) {
      throw new NotFoundException(`Version with id ${versionId} not found for note ${noteId}`);
    }

    // Update note to the version content
    const updatedNote = await this.noteRepository.save({
      ...note,
      content: version.content,
      title: version.title,
      description: version.description,
    });

    // Create new version for the restore action
    const user = await this.usersService.getUserById(userId);

    await this.noteVersionRepository.save({
      content: updatedNote.content,
      title: updatedNote.title,
      description: updatedNote.description,
      note: updatedNote,
      updatedBy: user,
    });

    return updatedNote;
  }

  // Add a comment to a note
  async addComment(noteId: string, commentData: { content: string; authorId: string; parentId?: string }): Promise<NoteComment> {
    const note = await this.getNoteById(noteId);
    const author = await this.usersService.getUserById(commentData.authorId);

    const comment = this.noteCommentRepository.create({
      content: commentData.content,
      author,
      note,
      parentId: commentData.parentId,
    });

    return this.noteCommentRepository.save(comment);
  }

  // Get all comments for a note
  async getNoteComments(noteId: string): Promise<NoteComment[]> {
    return this.noteCommentRepository.find({
      where: { note: { id: noteId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  // Delete a comment
  async deleteComment(commentId: string): Promise<void> {
    const comment = await this.noteCommentRepository.findOneBy({ id: commentId });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
    await this.noteCommentRepository.remove(comment);
  }

  /**
   * 上传笔记到知识库
   */
  async uploadToKnowledgeBase(noteId: string, userId: string): Promise<{ success: boolean; message: string; documentId?: string }> {
    try {
      const note = await this.getNoteById(noteId);

      if (note.owner.id !== userId) {
        throw new BadRequestException('无权操作此笔记');
      }

      if (note.knowledgeDocumentId) {
        return {
          success: false,
          message: '该笔记已上传到知识库',
        };
      }

      const createDocumentDto: CreateDocumentDto = {
        title: note.title,
        content: note.content,
        source: `笔记: ${note.title}`,
        documentType: 'text',
        metadata: {
          noteId: note.id,
          noteTitle: note.title,
          tags: note.tags,
          createdAt: note.createdAt,
        },
        uploadType: 'input',
      };

      const document = await this.knowledgeBaseService.addDocument(createDocumentDto, userId);

      await this.noteRepository.save({
        ...note,
        knowledgeDocumentId: document.id,
        syncedToKnowledgeAt: new Date(),
        needsSync: false,
      });

      return {
        success: true,
        message: '笔记已成功上传到知识库',
        documentId: document.id,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new BadRequestException(`上传到知识库失败: ${errorMsg}`);
    }
  }

  /**
   * 同步笔记到知识库
   */
  async syncToKnowledgeBase(noteId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const note = await this.getNoteById(noteId);

      if (note.owner.id !== userId) {
        throw new BadRequestException('无权操作此笔记');
      }

      if (!note.knowledgeDocumentId) {
        return {
          success: false,
          message: '该笔记未上传到知识库，请先上传',
        };
      }

      const updateData: Partial<CreateDocumentDto> = {
        title: note.title,
        content: note.content,
        metadata: {
          noteId: note.id,
          noteTitle: note.title,
          tags: note.tags,
          updatedAt: note.updatedAt,
        },
      };

      await this.knowledgeBaseService.updateDocument(note.knowledgeDocumentId, updateData, userId);

      await this.noteRepository.save({
        ...note,
        syncedToKnowledgeAt: new Date(),
        needsSync: false,
      });

      return {
        success: true,
        message: '笔记已成功同步到知识库',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new BadRequestException(`同步到知识库失败: ${errorMsg}`);
    }
  }


}
