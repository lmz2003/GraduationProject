import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { NoteVersion } from './entities/note-version.entity';
import { NoteComment } from './entities/note-comment.entity';
import { NotesGateway } from './notes.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteVersion, NoteComment]),
    UsersModule,
  ],
  controllers: [NotesController],
  providers: [NotesService, NotesGateway],
})
export class NotesModule {}
