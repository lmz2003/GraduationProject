import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // Create a new note
  @Post()
  async createNote(@Body() createNoteDto: CreateNoteDto, @Request() req: ExpressRequest) {
    // In a real application, you would get the user ID from the authenticated request
    const userId = req.user?.id || 'test-user-id';
    return this.notesService.createNote(createNoteDto, userId);
  }

  // Get all notes for the current user
  @Get()
  async getMyNotes(@Request() req: ExpressRequest) {
    // In a real application, you would get the user ID from the authenticated request
    const userId = req.user?.id || 'test-user-id';
    return this.notesService.getNotesByUserId(userId);
  }

  // Get a single note by id
  @Get(':id')
  async getNoteById(@Param('id') id: string) {
    return this.notesService.getNoteById(id);
  }

  // Update a note
  @Put(':id')
  async updateNote(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto, @Request() req: ExpressRequest) {
    // In a real application, you would get the user ID from the authenticated request
    const userId = req.user?.id || 'test-user-id';
    return this.notesService.updateNote(id, updateNoteDto, userId);
  }

  // Delete a note
  @Delete(':id')
  async deleteNote(@Param('id') id: string) {
    return this.notesService.deleteNote(id);
  }

  // Get note versions
  @Get(':id/versions')
  async getNoteVersions(@Param('id') id: string) {
    return this.notesService.getNoteVersions(id);
  }

  // Restore note from a version
  @Post(':id/restore/:versionId')
  async restoreNoteFromVersion(@Param('id') id: string, @Param('versionId') versionId: string, @Request() req: ExpressRequest) {
    // In a real application, you would get the user ID from the authenticated request
    const userId = req.user?.id || 'test-user-id';
    return this.notesService.restoreNoteFromVersion(id, versionId, userId);
  }

  // Get note comments
  @Get(':id/comments')
  async getNoteComments(@Param('id') id: string) {
    return this.notesService.getNoteComments(id);
  }

  // Add a comment to a note
  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() commentData: { content: string; parentId?: string }, @Request() req: ExpressRequest) {
    // In a real application, you would get the user ID from the authenticated request
    const authorId = req.user?.id || 'test-user-id';
    return this.notesService.addComment(id, { ...commentData, authorId });
  }

  // Delete a comment
  @Delete(':id/comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    return this.notesService.deleteComment(commentId);
  }


}
