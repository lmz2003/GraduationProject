import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface AnalysisProgress {
  resumeId: string;
  stage: number;
  stageName: string;
  message: string;
  isCompleted: boolean;
  overallScore?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/resume-analysis',
})
export class ResumeAnalysisGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private userResumes: Map<string, Set<string>> = new Map();

  private stageNames: Record<number, string> = {
    0: '准备分析',
    1: '文本提取',
    2: '结构解析',
    3: '评分分析',
    4: '报告生成',
    5: '分析完成',
  };

  handleConnection(client: Socket) {
    console.log(`[ResumeAnalysisGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[ResumeAnalysisGateway] Client disconnected: ${client.id}`);
    for (const [userId, resumeIds] of this.userResumes.entries()) {
      for (const resumeId of resumeIds) {
        this.server.to(resumeId).emit('user-disconnected', { socketId: client.id });
      }
    }
  }

  @SubscribeMessage('join-resume')
  handleJoinResume(
    @MessageBody() data: { resumeId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { resumeId, userId } = data;

    client.join(resumeId);

    if (!this.userResumes.has(userId)) {
      this.userResumes.set(userId, new Set());
    }
    this.userResumes.get(userId)?.add(resumeId);

    console.log(`[ResumeAnalysisGateway] User ${userId} joined resume ${resumeId}`);

    client.emit('joined-resume', { resumeId, message: 'Successfully joined resume room' });
  }

  @SubscribeMessage('leave-resume')
  handleLeaveResume(
    @MessageBody() data: { resumeId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { resumeId, userId } = data;

    client.leave(resumeId);

    this.userResumes.get(userId)?.delete(resumeId);

    console.log(`[ResumeAnalysisGateway] User ${userId} left resume ${resumeId}`);
  }

  emitProgress(resumeId: string, data: Omit<AnalysisProgress, 'resumeId'>) {
    const progressData: AnalysisProgress = {
      resumeId,
      ...data,
    };
    this.server.to(resumeId).emit('analysis-progress', progressData);
    console.log(`[ResumeAnalysisGateway] Progress emitted for ${resumeId}: Stage ${data.stage}`);
  }

  emitCompletion(resumeId: string, overallScore: number) {
    this.server.to(resumeId).emit('analysis-complete', {
      resumeId,
      overallScore,
      message: 'Analysis completed successfully',
    });
    console.log(`[ResumeAnalysisGateway] Completion emitted for ${resumeId}: Score ${overallScore}`);
  }

  emitError(resumeId: string, error: string) {
    this.server.to(resumeId).emit('analysis-error', {
      resumeId,
      error,
      message: 'Analysis failed',
    });
    console.log(`[ResumeAnalysisGateway] Error emitted for ${resumeId}: ${error}`);
  }

  getStageName(stage: number): string {
    return this.stageNames[stage] || '未知阶段';
  }
}
