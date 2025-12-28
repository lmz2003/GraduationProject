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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const notes_service_1 = require("./notes.service");
let NotesGateway = class NotesGateway {
    constructor(notesService) {
        this.notesService = notesService;
        this.onlineUsers = new Map();
        this.noteUsers = new Map(); // noteId -> set of userIds
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        // Remove user from online users and note users
        for (const [userId, { socket }] of this.onlineUsers.entries()) {
            if (socket === client) {
                this.onlineUsers.delete(userId);
                // Remove user from all note users
                for (const [noteId, userIds] of this.noteUsers.entries()) {
                    if (userIds.has(userId)) {
                        userIds.delete(userId);
                        // Notify other users in the note
                        this.server.to(noteId).emit('user-left', { userId });
                    }
                }
                break;
            }
        }
    }
    handleJoinNote(data, client) {
        var _a;
        const { noteId, user } = data;
        // Add user to online users
        this.onlineUsers.set(user.id, { socket: client, user });
        // Add user to note users
        if (!this.noteUsers.has(noteId)) {
            this.noteUsers.set(noteId, new Set());
        }
        (_a = this.noteUsers.get(noteId)) === null || _a === void 0 ? void 0 : _a.add(user.id);
        // Join the note room
        client.join(noteId);
        // Notify other users in the note
        this.server.to(noteId).emit('user-joined', { user });
        // Send current online users in the note to the new user
        const onlineUsersInNote = Array.from(this.noteUsers.get(noteId) || []).map(userId => {
            const userData = this.onlineUsers.get(userId);
            return userData === null || userData === void 0 ? void 0 : userData.user;
        }).filter(Boolean);
        client.emit('note-users', { users: onlineUsersInNote });
    }
    handleLeaveNote(data, client) {
        const { noteId, userId } = data;
        // Leave the note room
        client.leave(noteId);
        // Remove user from note users
        const noteUsers = this.noteUsers.get(noteId);
        if (noteUsers === null || noteUsers === void 0 ? void 0 : noteUsers.has(userId)) {
            noteUsers.delete(userId);
            // Notify other users in the note
            this.server.to(noteId).emit('user-left', { userId });
        }
    }
    handleNoteUpdate(data) {
        const { noteId, content, title, userId } = data;
        // Broadcast the update to all users in the note
        this.server.to(noteId).emit('note-updated', { content, title, userId });
        // Save the update to the database
        this.notesService.updateNoteContent(noteId, content, title, userId);
    }
    handleCursorUpdate(data) {
        const { noteId, userId, position } = data;
        // Broadcast the cursor position to all users in the note except the sender
        this.server.to(noteId).emit('cursor-updated', { userId, position });
    }
    handleSendComment(data) {
        const { noteId, comment } = data;
        // Broadcast the comment to all users in the note
        this.server.to(noteId).emit('comment-added', { comment });
        // Save the comment to the database
        this.notesService.addComment(noteId, comment);
    }
};
exports.NotesGateway = NotesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-note'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotesGateway.prototype, "handleJoinNote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-note'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotesGateway.prototype, "handleLeaveNote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('note-update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotesGateway.prototype, "handleNoteUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cursor-update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotesGateway.prototype, "handleCursorUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-comment'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotesGateway.prototype, "handleSendComment", null);
exports.NotesGateway = NotesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [notes_service_1.NotesService])
], NotesGateway);
