import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { NoteVersion } from './entities/note-version.entity';
import { NoteComment } from './entities/note-comment.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private noteRepository: Repository<Note>,
    @InjectRepository(NoteVersion) private noteVersionRepository: Repository<NoteVersion>,
    @InjectRepository(NoteComment) private noteCommentRepository: Repository<NoteComment>,
    private readonly usersService: UsersService,
  ) {}

  // Create a new note
  async createNote(createNoteDto: CreateNoteDto, ownerId: string): Promise<Note> {
    const owner = await this.usersService.getUserById(ownerId);

    const note = this.noteRepository.create({
      ...createNoteDto,
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

  // Get all notes for a user
  async getNotesByUserId(userId: string): Promise<Note[]> {
    return this.noteRepository.find({
      where: { owner: { id: userId } },
      relations: ['owner'],
    });
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

    // Update note
    const updatedNote = await this.noteRepository.save({
      ...note,
      ...updateNoteDto,
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
  async updateNoteContent(noteId: string, content: string, title: string, userId: string): Promise<void> {
    const note = await this.getNoteById(noteId);
    const user = await this.usersService.getUserById(userId);

    // Update note
    await this.noteRepository.save({
      ...note,
      content,
      title,
    });

    // Create new version
    await this.noteVersionRepository.save({
      content,
      title,
      description: note.description,
      note,
      updatedBy: user,
    });
  }

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    const note = await this.getNoteById(noteId);
    await this.noteRepository.remove(note);
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


}
