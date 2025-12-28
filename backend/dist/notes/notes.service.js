"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_entity_1 = require("./entities/note.entity");
const note_version_entity_1 = require("./entities/note-version.entity");
const note_comment_entity_1 = require("./entities/note-comment.entity");
const users_service_1 = require("../users/users.service");
let NotesService = class NotesService {
    constructor(noteRepository, noteVersionRepository, noteCommentRepository, usersService) {
        this.noteRepository = noteRepository;
        this.noteVersionRepository = noteVersionRepository;
        this.noteCommentRepository = noteCommentRepository;
        this.usersService = usersService;
    }
    // Create a new note
    createNote(createNoteDto, ownerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.usersService.getUserById(ownerId);
            const note = this.noteRepository.create(Object.assign(Object.assign({}, createNoteDto), { owner }));
            const savedNote = yield this.noteRepository.save(note);
            // Create initial version
            yield this.noteVersionRepository.save({
                content: savedNote.content,
                title: savedNote.title,
                description: savedNote.description,
                note: savedNote,
                updatedBy: owner,
            });
            return savedNote;
        });
    }
    // Get all notes for a user
    getNotesByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.noteRepository.find({
                where: { owner: { id: userId } },
                relations: ['owner'],
            });
        });
    }
    // Get a single note by id
    getNoteById(noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.noteRepository.findOne({
                where: { id: noteId },
                relations: ['owner', 'versions', 'comments', 'comments.author'],
            });
            if (!note) {
                throw new common_1.NotFoundException(`Note with id ${noteId} not found`);
            }
            return note;
        });
    }
    // Update a note
    updateNote(noteId, updateNoteDto, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.getNoteById(noteId);
            const user = yield this.usersService.getUserById(userId);
            // Update note
            const updatedNote = yield this.noteRepository.save(Object.assign(Object.assign({}, note), updateNoteDto));
            // Create new version
            yield this.noteVersionRepository.save({
                content: updatedNote.content,
                title: updatedNote.title,
                description: updatedNote.description,
                note: updatedNote,
                updatedBy: user,
            });
            return updatedNote;
        });
    }
    // Update note content (for real-time editing)
    updateNoteContent(noteId, content, title, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.getNoteById(noteId);
            const user = yield this.usersService.getUserById(userId);
            // Update note
            yield this.noteRepository.save(Object.assign(Object.assign({}, note), { content,
                title }));
            // Create new version
            yield this.noteVersionRepository.save({
                content,
                title,
                description: note.description,
                note,
                updatedBy: user,
            });
        });
    }
    // Delete a note
    deleteNote(noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.getNoteById(noteId);
            yield this.noteRepository.remove(note);
        });
    }
    // Get note versions
    getNoteVersions(noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.noteVersionRepository.find({
                where: { note: { id: noteId } },
                relations: ['updatedBy'],
                order: { createdAt: 'DESC' },
            });
        });
    }
    // Restore note from a version
    restoreNoteFromVersion(noteId, versionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.getNoteById(noteId);
            const version = yield this.noteVersionRepository.findOne({
                where: { id: versionId, note: { id: noteId } },
            });
            if (!version) {
                throw new common_1.NotFoundException(`Version with id ${versionId} not found for note ${noteId}`);
            }
            // Update note to the version content
            const updatedNote = yield this.noteRepository.save(Object.assign(Object.assign({}, note), { content: version.content, title: version.title, description: version.description }));
            // Create new version for the restore action
            const user = yield this.usersService.getUserById(userId);
            yield this.noteVersionRepository.save({
                content: updatedNote.content,
                title: updatedNote.title,
                description: updatedNote.description,
                note: updatedNote,
                updatedBy: user,
            });
            return updatedNote;
        });
    }
    // Add a comment to a note
    addComment(noteId, commentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.getNoteById(noteId);
            const author = yield this.usersService.getUserById(commentData.authorId);
            const comment = this.noteCommentRepository.create({
                content: commentData.content,
                author,
                note,
                parentId: commentData.parentId,
            });
            return this.noteCommentRepository.save(comment);
        });
    }
    // Get all comments for a note
    getNoteComments(noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.noteCommentRepository.find({
                where: { note: { id: noteId } },
                relations: ['author'],
                order: { createdAt: 'ASC' },
            });
        });
    }
    // Delete a comment
    deleteComment(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = yield this.noteCommentRepository.findOneBy({ id: commentId });
            if (!comment) {
                throw new common_1.NotFoundException(`Comment with id ${commentId} not found`);
            }
            yield this.noteCommentRepository.remove(comment);
        });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __param(1, (0, typeorm_1.InjectRepository)(note_version_entity_1.NoteVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(note_comment_entity_1.NoteComment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], NotesService);
