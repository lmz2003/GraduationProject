import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotesService } from './notes.service';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface NoteUpdate {
  noteId: string;
  content: string;
  title: string;
  userId: string;
}

interface CursorPosition {
  noteId: string;
  userId: string;
  position: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private onlineUsers: Map<string, { socket: Socket; user: User }> = new Map();
  private noteUsers: Map<string, Set<string>> = new Map(); // noteId -> set of userIds

  constructor(private readonly notesService: NotesService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
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

  @SubscribeMessage('join-note')
  handleJoinNote(@MessageBody() data: { noteId: string; user: User }, @ConnectedSocket() client: Socket) {
    const { noteId, user } = data;
    
    // Add user to online users
    this.onlineUsers.set(user.id, { socket: client, user });
    
    // Add user to note users
    if (!this.noteUsers.has(noteId)) {
      this.noteUsers.set(noteId, new Set());
    }
    this.noteUsers.get(noteId)?.add(user.id);
    
    // Join the note room
    client.join(noteId);
    
    // Notify other users in the note
    this.server.to(noteId).emit('user-joined', { user });
    
    // Send current online users in the note to the new user
    const onlineUsersInNote = Array.from(this.noteUsers.get(noteId) || []).map(userId => {
      const userData = this.onlineUsers.get(userId);
      return userData?.user;
    }).filter(Boolean);
    
    client.emit('note-users', { users: onlineUsersInNote });
  }

  @SubscribeMessage('leave-note')
  handleLeaveNote(@MessageBody() data: { noteId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const { noteId, userId } = data;
    
    // Leave the note room
    client.leave(noteId);
    
    // Remove user from note users
    const noteUsers = this.noteUsers.get(noteId);
    if (noteUsers?.has(userId)) {
      noteUsers.delete(userId);
      // Notify other users in the note
      this.server.to(noteId).emit('user-left', { userId });
    }
  }

  @SubscribeMessage('note-update')
  handleNoteUpdate(@MessageBody() data: NoteUpdate) {
    const { noteId, content, title, userId } = data;
    
    // Broadcast the update to all users in the note
    this.server.to(noteId).emit('note-updated', { content, title, userId });
    
    // Save the update to the database
    this.notesService.updateNoteContent(noteId, content, title, userId);
  }

  @SubscribeMessage('cursor-update')
  handleCursorUpdate(@MessageBody() data: CursorPosition) {
    const { noteId, userId, position } = data;
    
    // Broadcast the cursor position to all users in the note except the sender
    this.server.to(noteId).emit('cursor-updated', { userId, position });
  }

  @SubscribeMessage('send-comment')
  handleSendComment(@MessageBody() data: any) {
    const { noteId, comment } = data;
    
    // Broadcast the comment to all users in the note
    this.server.to(noteId).emit('comment-added', { comment });
    
    // Save the comment to the database
    this.notesService.addComment(noteId, comment);
  }
}
