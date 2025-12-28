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
exports.NotesController = void 0;
const common_1 = require("@nestjs/common");
const notes_service_1 = require("./notes.service");
const create_note_dto_1 = require("./dto/create-note.dto");
const update_note_dto_1 = require("./dto/update-note.dto");
let NotesController = class NotesController {
    constructor(notesService) {
        this.notesService = notesService;
    }
    // Create a new note
    createNote(createNoteDto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // In a real application, you would get the user ID from the authenticated request
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'test-user-id';
            return this.notesService.createNote(createNoteDto, userId);
        });
    }
    // Get all notes for the current user
    getMyNotes(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // In a real application, you would get the user ID from the authenticated request
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'test-user-id';
            return this.notesService.getNotesByUserId(userId);
        });
    }
    // Get a single note by id
    getNoteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.notesService.getNoteById(id);
        });
    }
    // Update a note
    updateNote(id, updateNoteDto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // In a real application, you would get the user ID from the authenticated request
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'test-user-id';
            return this.notesService.updateNote(id, updateNoteDto, userId);
        });
    }
    // Delete a note
    deleteNote(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.notesService.deleteNote(id);
        });
    }
    // Get note versions
    getNoteVersions(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.notesService.getNoteVersions(id);
        });
    }
    // Restore note from a version
    restoreNoteFromVersion(id, versionId, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // In a real application, you would get the user ID from the authenticated request
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'test-user-id';
            return this.notesService.restoreNoteFromVersion(id, versionId, userId);
        });
    }
    // Get note comments
    getNoteComments(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.notesService.getNoteComments(id);
        });
    }
    // Add a comment to a note
    addComment(id, commentData, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // In a real application, you would get the user ID from the authenticated request
            const authorId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'test-user-id';
            return this.notesService.addComment(id, Object.assign(Object.assign({}, commentData), { authorId }));
        });
    }
    // Delete a comment
    deleteComment(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.notesService.deleteComment(commentId);
        });
    }
};
exports.NotesController = NotesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_note_dto_1.CreateNoteDto, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "createNote", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getMyNotes", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getNoteById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_note_dto_1.UpdateNoteDto, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "updateNote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "deleteNote", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getNoteVersions", null);
__decorate([
    (0, common_1.Post)(':id/restore/:versionId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('versionId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "restoreNoteFromVersion", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getNoteComments", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)(':id/comments/:commentId'),
    __param(0, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "deleteComment", null);
exports.NotesController = NotesController = __decorate([
    (0, common_1.Controller)('notes'),
    __metadata("design:paramtypes", [notes_service_1.NotesService])
], NotesController);
