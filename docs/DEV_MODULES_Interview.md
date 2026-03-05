# 模拟面试模块 - 开发模块划分

## 文档信息

| 项目 | 内容 |
|------|------|
| 关联PRD | PRD_Interview_Module.md V1.1.0 |
| 创建日期 | 2026-02-28 |
| 文档版本 | V1.2.0 |
| 更新日期 | 2026-03-04 |
| 开发状态 | 🚧 开发中 |

### 版本历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|---------|------|
| V1.0.0 | 2026-02-28 | 初始版本 | - |
| V1.1.0 | 2026-03-01 | 新增语音输入、语音通话、视频面试模块 | - |
| V1.2.0 | 2026-03-04 | 完成 M-BE-09/10/M-FE-08/09/11 语音模块；新增 M-FE-12 面试进度恢复修复 | - |

---

## 目录

1. [模块总览](#1-模块总览)
2. [后端开发模块](#2-后端开发模块)
3. [前端开发模块](#3-前端开发模块)
4. [模块依赖关系](#4-模块依赖关系)
5. [开发顺序建议](#5-开发顺序建议)
6. [任务清单](#6-任务清单)

---

## 1. 模块总览

### 1.1 模块架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           模拟面试模块开发架构                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 前端模块                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ M-FE-01 ✅  │  │ M-FE-02 ✅  │  │ M-FE-03 ✅  │  │ M-FE-04 ✅  │        │
│  │ 场景选择    │  │ 面试对话    │  │ 面试报告    │  │ 历史记录    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ M-FE-05 ✅  │  │ M-FE-06 ✅  │  │ M-FE-07 ✅  │  │ M-FE-08 ✅  │        │
│  │ 公共组件    │  │ 状态管理    │  │ 工具函数    │  │ 语音输入    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │ M-FE-09 ✅  │  │ M-FE-10 🆕  │  │ M-FE-11 ✅  │                         │
│  │ 语音通话    │  │ 视频面试    │  │ 面试形式    │                         │
│  │    页面     │  │    页面     │  │    选择     │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/SSE/WebSocket
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 后端模块                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ M-BE-01 ✅  │  │ M-BE-02 ✅  │  │ M-BE-03 ✅  │  │ M-BE-04 ✅  │        │
│  │ 数据模型    │  │ 场景管理    │  │ 会话管理    │  │ 消息处理    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ M-BE-05 ✅  │  │ M-BE-06 ✅  │  │ M-BE-07 ✅  │  │ M-BE-08 ✅  │        │
│  │ LLM服务     │  │ 评估服务    │  │ 报告服务    │  │ 控制器层    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ M-BE-09 ✅  │  │ M-BE-10 ✅  │  │ M-BE-11 🆕  │  │ M-BE-12 🆕  │        │
│  │ 语音识别    │  │ 语音合成    │  │ 视频处理    │  │ 数字人      │        │
│  │  (ASR)      │  │  (TTS)      │  │    服务     │  │    服务     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块清单

| 模块ID | 模块名称 | 类型 | 优先级 | 预估工时 | 状态 |
|--------|---------|------|--------|---------|------|
| M-BE-01 | 数据模型模块 | 后端 | P0 | 8h | ✅ 已完成 |
| M-BE-02 | 场景管理模块 | 后端 | P0 | 4h | ✅ 已完成 |
| M-BE-03 | 会话管理模块 | 后端 | P0 | 8h | ✅ 已完成 |
| M-BE-04 | 消息处理模块 | 后端 | P0 | 8h | ✅ 已完成 |
| M-BE-05 | LLM服务模块 | 后端 | P0 | 16h | ✅ 已完成 |
| M-BE-06 | 评估服务模块 | 后端 | P0 | 12h | ✅ 已完成 |
| M-BE-07 | 报告服务模块 | 后端 | P0 | 8h | ✅ 已完成 |
| M-BE-08 | 控制器层模块 | 后端 | P0 | 8h | ✅ 已完成 |
| M-BE-09 | 语音识别服务(ASR) | 后端 | P1 | 12h | ✅ 已完成 |
| M-BE-10 | 语音合成服务(TTS) | 后端 | P1 | 8h | ✅ 已完成 |
| M-BE-11 | 视频处理服务 | 后端 | P2 | 16h | 🆕 待开发 |
| M-BE-12 | 数字人服务 | 后端 | P2 | 24h | 🆕 待开发 |
| M-FE-01 | 场景选择页面 | 前端 | P0 | 12h | ✅ 已完成 |
| M-FE-02 | 面试对话页面 | 前端 | P0 | 20h | ✅ 已完成 |
| M-FE-03 | 面试报告页面 | 前端 | P0 | 16h | ✅ 已完成 |
| M-FE-04 | 历史记录页面 | 前端 | P1 | 8h | ✅ 已完成 |
| M-FE-05 | 公共组件模块 | 前端 | P0 | 8h | ✅ 已完成 |
| M-FE-06 | 状态管理模块 | 前端 | P0 | 8h | ✅ 已完成 |
| M-FE-07 | 工具函数模块 | 前端 | P1 | 4h | ✅ 已完成 |
| M-FE-08 | 语音输入组件 | 前端 | P1 | 8h | ✅ 已完成 |
| M-FE-09 | 语音通话页面 | 前端 | P1 | 16h | ✅ 已完成 |
| M-FE-10 | 视频面试页面 | 前端 | P2 | 24h | 🆕 待开发 |
| M-FE-11 | 面试形式选择 | 前端 | P1 | 4h | ✅ 已完成 |
| M-FE-12 | 面试进度保存与恢复优化 | 前端 | P0 | 3h | ✅ 已完成 |

---

## 2. 后端开发模块

### 2.1 M-BE-01: 数据模型模块 ✅ 已完成

**模块描述：** 定义面试模块的所有数据库实体和数据传输对象

**文件结构：**
```
backend/src/interview/
├── entities/
│   ├── interview.entity.ts          # ✅ 面试主表实体
│   ├── interview-session.entity.ts  # ✅ 面试会话实体
│   ├── interview-message.entity.ts  # ✅ 面试消息实体
│   └── interview-report.entity.ts   # ✅ 面试报告实体
├── dto/
│   ├── create-interview.dto.ts      # ✅ 创建面试DTO
│   ├── send-message.dto.ts          # ✅ 发送消息DTO
│   └── interview-response.dto.ts    # ✅ 面试响应DTO
└── constants/
    └── scene-config.ts              # ✅ 场景配置常量
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-01-01 | 创建Interview实体类 | interview.entity.ts | 1h | ✅ |
| T-BE-01-02 | 创建InterviewSession实体类 | interview-session.entity.ts | 1h | ✅ |
| T-BE-01-03 | 创建InterviewMessage实体类 | interview-message.entity.ts | 1h | ✅ |
| T-BE-01-04 | 创建InterviewReport实体类 | interview-report.entity.ts | 1h | ✅ |
| T-BE-01-05 | 创建CreateInterviewDTO | create-interview.dto.ts | 0.5h | ✅ |
| T-BE-01-06 | 创建SendMessageDTO | send-message.dto.ts | 0.5h | ✅ |
| T-BE-01-07 | 创建响应DTO类 | interview-response.dto.ts | 1h | ✅ |
| T-BE-01-08 | 定义场景/岗位/难度常量 | scene-config.ts | 1h | ✅ |
| T-BE-01-09 | 配置实体关系和索引 | - | 1h | ✅ |

**数据模型详细设计：**

```typescript
// entities/interview.entity.ts
@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  sceneType: string;  // technical, behavioral, hr, stress, group

  @Column({ type: 'varchar', length: 50, nullable: true })
  jobType: string;  // frontend, backend, fullstack, pm, data, design, general

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  difficulty: string;  // junior, medium, senior

  @Column({ type: 'uuid', nullable: true })
  resumeId: string;

  @Column({ type: 'float', nullable: true })
  totalScore: number;

  @Column({ type: 'integer', nullable: true })
  duration: number;  // 秒

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;  // pending, in_progress, completed, interrupted, abandoned

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.interviews)
  user: User;

  @ManyToOne(() => Resume, { nullable: true })
  resume: Resume;

  @OneToMany(() => InterviewSession, (session) => session.interview)
  sessions: InterviewSession[];

  @OneToOne(() => InterviewReport, (report) => report.interview)
  report: InterviewReport;
}

// entities/interview-session.entity.ts
@Entity('interview_sessions')
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interviewId: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;  // active, ended

  @Column({ type: 'integer', default: 0 })
  questionCount: number;

  @Column({ type: 'integer', default: 0 })
  messageCount: number;

  @ManyToOne(() => Interview, (interview) => interview.sessions)
  interview: Interview;

  @OneToMany(() => InterviewMessage, (message) => message.session)
  messages: InterviewMessage[];
}

// entities/interview-message.entity.ts
@Entity('interview_messages')
export class InterviewMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'varchar', length: 20 })
  role: string;  // user, assistant

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  questionType: string;  // opening, core, follow_up, closing

  @Column({ type: 'jsonb', nullable: true })
  evaluation: {
    completeness: number;
    clarity: number;
    depth: number;
    expression: number;
    highlights: number;
    overall: number;
    suggestions: string[];
  };

  @Column({ type: 'float', nullable: true })
  score: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  sources: Array<{
    documentId: string;
    content: string;
    score: number;
  }>;

  @ManyToOne(() => InterviewSession, (session) => session.messages)
  session: InterviewSession;
}

// entities/interview-report.entity.ts
@Entity('interview_reports')
export class InterviewReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interviewId: string;

  @Column({ type: 'float' })
  overallScore: number;

  @Column({ type: 'jsonb' })
  dimensionScores: {
    completeness: number;
    clarity: number;
    depth: number;
    expression: number;
    highlights: number;
  };

  @Column({ type: 'text' })
  strengths: string;

  @Column({ type: 'text' })
  weaknesses: string;

  @Column({ type: 'text' })
  suggestions: string;

  @Column({ type: 'jsonb', nullable: true })
  learningResources: Array<{
    type: string;
    title: string;
    url: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Interview, (interview) => interview.report)
  interview: Interview;
}
```

---

### 2.2 M-BE-02: 场景管理模块

**模块描述：** 管理面试场景配置，提供场景列表查询

**文件结构：**
```
backend/src/interview/
├── services/
│   └── scene.service.ts             # ✅ 场景管理服务
└── constants/
    └── scene-config.ts              # ✅ 场景配置数据
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-02-01 | 定义场景配置数据结构 | scene-config.ts | 0.5h | ✅ |
| T-BE-02-02 | 实现场景列表查询方法 | scene.service.ts | 1h | ✅ |
| T-BE-02-03 | 实现岗位类型查询方法 | scene.service.ts | 0.5h | ✅ |
| T-BE-02-04 | 实现难度等级查询方法 | scene.service.ts | 0.5h | ✅ |
| T-BE-02-05 | 编写单元测试 | scene.service.spec.ts | 1.5h | ✅ |

**核心代码：**

```typescript
// constants/scene-config.ts
export const SCENE_CONFIG = {
  technical: {
    code: 'technical',
    name: '技术面试',
    description: '针对技术岗位的专业面试',
    icon: '💻',
    questionCount: { min: 6, max: 10 },
    categories: ['algorithm', 'system_design', 'project', 'technical_depth'],
    systemPrompt: `你是一位资深技术面试官，正在进行技术面试...`,
  },
  behavioral: {
    code: 'behavioral',
    name: '行为面试',
    description: '基于过往经历的行为面试',
    icon: '🤝',
    questionCount: { min: 5, max: 8 },
    categories: ['teamwork', 'problem_solving', 'leadership', 'communication'],
    systemPrompt: `你是一位资深HR面试官，正在进行行为面试...`,
  },
  hr: {
    code: 'hr',
    name: 'HR面试',
    description: '人力资源综合面试',
    icon: '👔',
    questionCount: { min: 5, max: 8 },
    categories: ['career', 'salary', 'company', 'personality'],
    systemPrompt: `你是一位资深HR面试官...`,
  },
  stress: {
    code: 'stress',
    name: '压力面试',
    description: '高压情境模拟面试',
    icon: '😰',
    questionCount: { min: 4, max: 6 },
    categories: ['challenge', 'conflict', 'pressure', 'criticism'],
    systemPrompt: `你是一位严格的面试官...`,
  },
};

export const JOB_TYPE_CONFIG = {
  frontend: { code: 'frontend', name: '前端开发', keywords: ['React', 'Vue', 'TypeScript', 'CSS'] },
  backend: { code: 'backend', name: '后端开发', keywords: ['Java', 'Python', 'Node.js', 'MySQL'] },
  fullstack: { code: 'fullstack', name: '全栈开发', keywords: ['Full Stack', 'React', 'Node.js'] },
  pm: { code: 'pm', name: '产品经理', keywords: ['Product', 'Roadmap', 'User Research'] },
  data: { code: 'data', name: '数据分析师', keywords: ['SQL', 'Python', 'Tableau', 'Statistics'] },
  design: { code: 'design', name: 'UI/UX设计', keywords: ['Figma', 'UI', 'UX', 'Design System'] },
  general: { code: 'general', name: '通用岗位', keywords: [] },
};

// services/scene.service.ts
@Injectable()
export class SceneService {
  getSceneList(): SceneDTO[] {
    return Object.values(SCENE_CONFIG).map(scene => ({
      code: scene.code,
      name: scene.name,
      description: scene.description,
      icon: scene.icon,
      questionCount: scene.questionCount,
    }));
  }

  getJobTypeList(): JobTypeDTO[] {
    return Object.values(JOB_TYPE_CONFIG);
  }

  getDifficultyLevels(): DifficultyLevelDTO[] {
    return [
      { code: 'junior', name: '初级', description: '适合应届生和初级岗位' },
      { code: 'medium', name: '中级', description: '适合有1-3年经验的求职者' },
      { code: 'senior', name: '高级', description: '适合资深岗位和管理岗位' },
    ];
  }

  getSceneConfig(sceneType: string) {
    return SCENE_CONFIG[sceneType];
  }
}
```

---

### 2.3 M-BE-03: 会话管理模块 ✅ 已完成

**模块描述：** 管理面试会话的创建、查询、更新和恢复

**文件结构：**
```
backend/src/interview/
└── services/
    └── interview-session.service.ts  # ✅ 会话管理服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-03-01 | 实现创建面试方法 | createInterview() | 1h | ✅ |
| T-BE-03-02 | 实现获取面试列表方法 | getInterviewList() | 1h | ✅ |
| T-BE-03-03 | 实现获取面试详情方法 | getInterviewById() | 1h | ✅ |
| T-BE-03-04 | 实现开始面试会话方法 | startSession() | 1.5h | ✅ |
| T-BE-03-05 | 实现结束面试方法 | endInterview() | 1.5h | ✅ |
| T-BE-03-06 | 实现恢复中断面试方法 | resumeInterview() | 1h | ✅ |
| T-BE-03-07 | 实现删除面试方法 | deleteInterview() | 0.5h | ✅ |
| T-BE-03-08 | 编写单元测试 | interview-session.service.spec.ts | 0.5h | ✅ |

**核心代码：**

```typescript
// services/interview-session.service.ts
@Injectable()
export class InterviewSessionService {
  constructor(
    @InjectRepository(Interview)
    private interviewRepository: Repository<Interview>,
    @InjectRepository(InterviewSession)
    private sessionRepository: Repository<InterviewSession>,
    private sceneService: SceneService,
    private llmService: InterviewLLMService,
  ) {}

  async createInterview(userId: string, dto: CreateInterviewDTO): Promise<Interview> {
    const interview = this.interviewRepository.create({
      userId,
      sceneType: dto.sceneType,
      jobType: dto.jobType,
      difficulty: dto.difficulty || 'medium',
      resumeId: dto.resumeId,
      status: 'pending',
    });
    return await this.interviewRepository.save(interview);
  }

  async startSession(interviewId: string, userId: string): Promise<StartSessionResult> {
    const interview = await this.getInterviewById(interviewId, userId);
    
    if (interview.status === 'in_progress') {
      throw new BadRequestException('面试已在进行中');
    }

    const session = this.sessionRepository.create({
      interviewId,
      startedAt: new Date(),
      status: 'active',
    });
    await this.sessionRepository.save(session);

    interview.status = 'in_progress';
    await this.interviewRepository.save(interview);

    const firstMessage = await this.llmService.generateOpening(interview);
    await this.saveMessage(session.id, 'assistant', firstMessage.content, 'opening');

    return { sessionId: session.id, interview, firstMessage };
  }

  async endInterview(interviewId: string, userId: string, sessionId: string): Promise<EndInterviewResult> {
    const interview = await this.getInterviewById(interviewId, userId);
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

    session.status = 'ended';
    session.endedAt = new Date();
    await this.sessionRepository.save(session);

    interview.status = 'completed';
    interview.duration = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    await this.interviewRepository.save(interview);

    const report = await this.generateReport(interview, session);

    return { interview, reportId: report.id };
  }
}
```

---

### 2.4 M-BE-04: 消息处理模块 ✅ 已完成

**模块描述：** 处理面试消息的存储、查询和流式响应

**文件结构：**
```
backend/src/interview/
└── services/
    └── interview-message.service.ts  # ✅ 消息处理服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-04-01 | 实现保存消息方法 | saveMessage() | 1h | ✅ |
| T-BE-04-02 | 实现获取消息历史方法 | getMessageHistory() | 1h | ✅ |
| T-BE-04-03 | 实现流式消息处理方法 | streamMessage() | 3h | ✅ |
| T-BE-04-04 | 实现消息格式转换方法 | formatMessages() | 1h | ✅ |
| T-BE-04-05 | 实现SSE响应封装 | createSSEResponse() | 1h | ✅ |
| T-BE-04-06 | 编写单元测试 | interview-message.service.spec.ts | 1h | ✅ |

**核心代码：**

```typescript
// services/interview-message.service.ts
@Injectable()
export class InterviewMessageService {
  constructor(
    @InjectRepository(InterviewMessage)
    private messageRepository: Repository<InterviewMessage>,
    private llmService: InterviewLLMService,
    private evaluatorService: InterviewEvaluatorService,
  ) {}

  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    questionType?: string,
    evaluation?: any,
  ): Promise<InterviewMessage> {
    const message = this.messageRepository.create({
      sessionId,
      role,
      content,
      questionType,
      evaluation,
      timestamp: new Date(),
    });
    return await this.messageRepository.save(message);
  }

  async *streamMessage(
    sessionId: string,
    userMessage: string,
    interview: Interview,
  ): AsyncGenerator<SSEEvent> {
    await this.saveMessage(sessionId, 'user', userMessage);
    const history = await this.getMessageHistory(sessionId);

    let fullContent = '';
    const stream = this.llmService.streamChat(history, interview);

    for await (const chunk of stream) {
      fullContent += chunk;
      yield { type: 'content', content: chunk };
    }

    const evaluation = await this.evaluatorService.evaluateAnswer(
      this.getLastQuestion(history),
      userMessage,
      interview,
    );

    yield { type: 'evaluation', ...evaluation };
    await this.saveMessage(sessionId, 'assistant', fullContent, 'response', evaluation);
  }
}
```

---

### 2.5 M-BE-05: LLM服务模块 ✅ 已完成

**模块描述：** 封装与大语言模型的交互，处理问题生成、追问生成等

**文件结构：**
```
backend/src/interview/
└── services/
    └── interview-llm.service.ts      # ✅ LLM服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-05-01 | 实现开场白生成方法 | generateOpening() | 2h | ✅ |
| T-BE-05-02 | 实现问题生成方法 | generateQuestion() | 3h | ✅ |
| T-BE-05-03 | 实现追问生成方法 | generateFollowUp() | 2h | ✅ |
| T-BE-05-04 | 实现结束语生成方法 | generateClosing() | 1h | ✅ |
| T-BE-05-05 | 实现流式聊天方法 | streamChat() | 4h | ✅ |
| T-BE-05-06 | 设计和实现Prompt模板 | prompt-templates.ts | 3h | ✅ |
| T-BE-05-07 | 实现简历上下文注入 | injectResumeContext() | 1h | ✅ |

**核心代码：**

```typescript
// services/interview-llm.service.ts
@Injectable()
export class InterviewLLMService {
  async generateOpening(interview: Interview): Promise<ChatMessage> {
    const sceneConfig = SCENE_CONFIG[interview.sceneType];
    const systemPrompt = this.buildSystemPrompt(sceneConfig, interview);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请开始面试，先做自我介绍，然后提出第一个问题。' },
      ],
    });

    return { role: 'assistant', content: response.choices[0].message.content };
  }

  async *streamChat(history: InterviewMessage[], interview: Interview): AsyncGenerator<string> {
    const sceneConfig = SCENE_CONFIG[interview.sceneType];
    const systemPrompt = this.buildSystemPrompt(sceneConfig, interview);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  }

  private buildSystemPrompt(sceneConfig: SceneConfig, interview: Interview): string {
    let prompt = sceneConfig.systemPrompt;
    prompt = prompt.replace('{jobType}', interview.jobType || '通用岗位');
    prompt = prompt.replace('{difficulty}', interview.difficulty);
    
    if (interview.resumeId && interview.resume) {
      prompt += `\n\n候选人简历摘要：\n${this.extractResumeSummary(interview.resume)}`;
    }
    
    return prompt;
  }
}
```

---

### 2.6 M-BE-06: 评估服务模块 ✅ 已完成

**模块描述：** 实现回答评估逻辑，计算各维度评分

**文件结构：**
```
backend/src/interview/
└── services/
    └── interview-evaluator.service.ts  # ✅ 评估服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-06-01 | 实现单题评估方法 | evaluateAnswer() | 3h | ✅ |
| T-BE-06-02 | 实现维度评分计算 | calculateDimensionScores() | 2h | ✅ |
| T-BE-06-03 | 实现改进建议生成 | generateSuggestions() | 2h | ✅ |
| T-BE-06-04 | 实现追问判断逻辑 | shouldFollowUp() | 1h | ✅ |
| T-BE-06-05 | 实现综合评分计算 | calculateOverallScore() | 1h | ✅ |
| T-BE-06-06 | 设计评估Prompt模板 | evaluation-prompts.ts | 2h | ✅ |
| T-BE-06-07 | 编写单元测试 | evaluator.service.spec.ts | 1h | ✅ |

**核心代码：**

```typescript
// services/interview-evaluator.service.ts
@Injectable()
export class InterviewEvaluatorService {
  async evaluateAnswer(
    question: string,
    answer: string,
    interview: Interview,
  ): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(question, answer, interview);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      scores: {
        completeness: result.completeness,
        clarity: result.clarity,
        depth: result.depth,
        expression: result.expression,
        highlights: result.highlights,
      },
      overall: this.calculateOverallScore(result),
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
      followUp: result.followUp,
      followUpQuestion: result.followUpQuestion,
    };
  }

  private calculateOverallScore(scores: DimensionScores): number {
    const weights = { completeness: 0.25, clarity: 0.25, depth: 0.25, expression: 0.15, highlights: 0.10 };
    return Math.round(
      scores.completeness * weights.completeness +
      scores.clarity * weights.clarity +
      scores.depth * weights.depth +
      scores.expression * weights.expression +
      scores.highlights * weights.highlights
    * 10) / 10;
  }
}
```

---

### 2.7 M-BE-07: 报告服务模块 ✅ 已完成

**模块描述：** 生成面试报告，汇总评估结果

**文件结构：**
```
backend/src/interview/
└── services/
    └── interview-report.service.ts   # ✅ 报告服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-07-01 | 实现报告生成方法 | generateReport() | 2h | ✅ |
| T-BE-07-02 | 实现维度评分汇总 | aggregateDimensionScores() | 1h | ✅ |
| T-BE-07-03 | 实现优势分析生成 | analyzeStrengths() | 1h | ✅ |
| T-BE-07-04 | 实现劣势分析生成 | analyzeWeaknesses() | 1h | ✅ |
| T-BE-07-05 | 实现学习建议生成 | generateLearningSuggestions() | 1.5h | ✅ |
| T-BE-07-06 | 实现报告查询方法 | getReport() | 0.5h | ✅ |
| T-BE-07-07 | 编写单元测试 | report.service.spec.ts | 1h | ✅ |

---

### 2.8 M-BE-08: 控制器层模块 ✅ 已完成

**模块描述：** 实现所有API接口，处理请求和响应

**文件结构：**
```
backend/src/interview/
├── interview.controller.ts           # ✅ 主控制器
└── interview.module.ts               # ✅ 模块定义
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-08-01 | 实现场景相关接口 | GET /scenes, /job-types | 1h | ✅ |
| T-BE-08-02 | 实现面试CRUD接口 | POST/GET/DELETE /interview | 1.5h | ✅ |
| T-BE-08-03 | 实现会话控制接口 | POST /start, /end, /resume | 1.5h | ✅ |
| T-BE-08-04 | 实现消息发送接口 | POST /message | 1h | ✅ |
| T-BE-08-05 | 实现流式响应接口 | POST /message/stream (SSE) | 2h | ✅ |
| T-BE-08-06 | 实现报告查询接口 | GET /report | 0.5h | ✅ |
| T-BE-08-07 | 添加认证守卫和验证 | UseGuards, ValidationPipe | 0.5h | ✅ |

**核心代码：**

```typescript
// interview.controller.ts
@Controller('interview')
@UseGuards(AuthGuard('jwt'))
export class InterviewController {
  @Get('scenes')
  async getScenes() {
    return { code: 0, message: 'ok', data: this.sceneService.getSceneList() };
  }

  @Post()
  async createInterview(@Body() dto: CreateInterviewDTO, @Request() req: any) {
    const userId = req.user.id;
    const interview = await this.sessionService.createInterview(userId, dto);
    return { code: 0, message: 'created', data: interview };
  }

  @Post(':id/start')
  async startSession(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    const result = await this.sessionService.startSession(id, userId);
    return { code: 0, message: 'ok', data: result };
  }

  @Post(':id/message/stream')
  async streamMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDTO,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const interview = await this.sessionService.getInterviewById(id, userId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of this.messageService.streamMessage(dto.sessionId, dto.message, interview)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  }

  @Post(':id/end')
  async endInterview(@Param('id') id: string, @Body() dto: EndInterviewDTO, @Request() req: any) {
    const userId = req.user.id;
    const result = await this.sessionService.endInterview(id, userId, dto.sessionId);
    return { code: 0, message: 'ok', data: result };
  }

  @Get(':id/report')
  async getReport(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    const report = await this.reportService.getReport(id, userId);
    return { code: 0, message: 'ok', data: report };
  }
}
```

---

### 2.9 M-BE-09: 语音识别服务(ASR) ✅ 已完成

**模块描述：** 提供语音转文字能力，支持音频文件上传识别（Whisper API via Axios）

**文件结构：**
```
backend/src/interview/
└── services/
    └── speech-recognition.service.ts  # 🆕 语音识别服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-09-01 | 集成 Whisper API (Axios) | speech-recognition.service.ts | 2h | ✅ |
| T-BE-09-02 | 实现音频文件上传识别 | POST /interview/speech-to-text | 2h | ✅ |
| T-BE-09-03 | 实现实时流式语音识别 | WebSocket流式处理 | 4h | 🔄 降级/暂缓 |
| T-BE-09-04 | 实现VAD语音活动检测 | 静音检测、说话结束判断 | 2h | ⏸️ 暂缓 |
| T-BE-09-05 | 添加音频格式转换 | 支持多种音频格式 | 1h | ✅ |
| T-BE-09-06 | 编写单元测试 | speech-recognition.service.spec.ts | 1h | ⏸️ 暂缓 |

**核心代码：**

```typescript
// services/speech-recognition.service.ts
@Injectable()
export class SpeechRecognitionService {
  constructor(private readonly configService: ConfigService) {}

  async transcribeAudio(audioBuffer: Buffer, language: string = 'zh'): Promise<TranscriptionResult> {
    const openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });

    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      language,
      response_format: 'verbose_json',
    });

    return {
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    };
  }

  async *transcribeStream(audioStream: AsyncIterable<Buffer>): AsyncGenerator<string> {
    // 实时流式识别实现
  }
}
```

**技术选型：**

| 技术 | 用途 | 说明 |
|------|------|------|
| OpenAI Whisper | 语音识别 | 高准确率，支持多语言 |
| fluent-ffmpeg | 音频格式转换 | 服务端音频处理 |
| @discordjs/opus | Opus编解码 | 实时音频处理 |

---

### 2.10 M-BE-10: 语音合成服务(TTS) ✅ 已完成

**模块描述：** 提供文字转语音能力，支持多种音色和语速调节（OpenAI TTS API via Axios）

**文件结构：**
```
backend/src/interview/
└── services/
    └── speech-synthesis.service.ts  # 🆕 语音合成服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-10-01 | 集成 TTS API (Axios) | speech-synthesis.service.ts | 2h | ✅ |
| T-BE-10-02 | 实现文本转语音接口 | POST /interview/text-to-speech | 2h | ✅ |
| T-BE-10-03 | 实现流式语音合成 | SSE流式输出 | 2h | ⏸️ 暂缓 |
| T-BE-10-04 | 支持多音色选择 | 音色配置管理 | 1h | ✅ |
| T-BE-10-05 | 实现语音缓存机制 | 减少重复合成请求 | 1h | ⏸️ 暂缓 |

**核心代码：**

```typescript
// services/speech-synthesis.service.ts
@Injectable()
export class SpeechSynthesisService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async synthesize(text: string, voice: string = 'alloy'): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as any,
      input: text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }

  async *synthesizeStream(text: string, voice: string = 'alloy'): AsyncGenerator<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as any,
      input: text,
      response_format: 'mp3',
    });

    const stream = response.body;
    for await (const chunk of stream) {
      yield Buffer.from(chunk);
    }
  }
}
```

**支持的音色：**

| 音色代码 | 描述 | 适用场景 |
|---------|------|---------|
| alloy | 中性音色 | 通用场景 |
| echo | 男性音色 | 技术面试 |
| fable | 英式口音 | 英语面试 |
| onyx | 深沉男声 | 压力面试 |
| nova | 女性音色 | HR面试 |
| shimmer | 温柔女声 | 行为面试 |

---

### 2.11 M-BE-11: 视频处理服务 🆕 待开发

**模块描述：** 处理视频流的采集、传输和存储

**文件结构：**
```
backend/src/interview/
└── services/
    └── video-processing.service.ts  # 🆕 视频处理服务
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-11-01 | 实现WebRTC信令服务 | WebSocket信令处理 | 4h | 🆕 |
| T-BE-11-02 | 实现视频流接收 | 接收用户视频流 | 3h | 🆕 |
| T-BE-11-03 | 实现视频帧提取 | 关键帧提取存储 | 2h | 🆕 |
| T-BE-11-04 | 实现视频存储 | 云存储集成 | 2h | 🆕 |
| T-BE-11-05 | 实现视频回放接口 | 历史视频播放 | 2h | 🆕 |
| T-BE-11-06 | 编写单元测试 | video-processing.service.spec.ts | 3h | 🆕 |

**核心代码：**

```typescript
// services/video-processing.service.ts
@Injectable()
export class VideoProcessingService {
  private readonly peerConnections: Map<string, RTCPeerConnection> = new Map();

  async createPeerConnection(sessionId: string): Promise<RTCSessionDescription> {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.peerConnections.set(sessionId, pc);

    pc.ontrack = (event) => {
      this.handleIncomingTrack(sessionId, event);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return offer;
  }

  async handleAnswer(sessionId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(sessionId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleIncomingTrack(sessionId: string, event: RTCTrackEvent): Promise<void> {
    // 处理接收到的视频/音频轨道
  }
}
```

---

### 2.12 M-BE-12: 数字人服务 🆕 待开发

**模块描述：** 管理虚拟面试官形象，实现唇形同步和表情动画

**文件结构：**
```
backend/src/interview/
└── services/
    └── avatar.service.ts  # 🆕 数字人服务
└── config/
    └── avatar-config.ts   # 🆕 数字人配置
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-BE-12-01 | 定义数字人配置结构 | avatar-config.ts | 2h | 🆕 |
| T-BE-12-02 | 集成D-ID API或自研方案 | avatar.service.ts | 6h | 🆕 |
| T-BE-12-03 | 实现唇形同步 | 音频驱动面部动画 | 6h | 🆕 |
| T-BE-12-04 | 实现表情动画系统 | 表情状态管理 | 4h | 🆕 |
| T-BE-12-05 | 实现数字人视频生成 | 生成带数字人的视频 | 4h | 🆕 |
| T-BE-12-06 | 编写单元测试 | avatar.service.spec.ts | 2h | 🆕 |

**核心代码：**

```typescript
// config/avatar-config.ts
export interface AvatarConfig {
  id: string;
  name: string;
  modelUrl: string;
  thumbnailUrl: string;
  voiceId: string;
  style: 'professional' | 'friendly' | 'strict';
  animations: {
    idle: string;
    speaking: string;
    listening: string;
    thinking: string;
  };
}

export const DEFAULT_AVATARS: AvatarConfig[] = [
  {
    id: 'interviewer-male-1',
    name: '李经理',
    modelUrl: '/avatars/male-1.glb',
    thumbnailUrl: '/avatars/male-1-thumb.png',
    voiceId: 'echo',
    style: 'professional',
    animations: {
      idle: 'idle_professional',
      speaking: 'speaking_professional',
      listening: 'listening_professional',
      thinking: 'thinking_professional',
    },
  },
  {
    id: 'interviewer-female-1',
    name: '王总监',
    modelUrl: '/avatars/female-1.glb',
    thumbnailUrl: '/avatars/female-1-thumb.png',
    voiceId: 'nova',
    style: 'friendly',
    animations: {
      idle: 'idle_friendly',
      speaking: 'speaking_friendly',
      listening: 'listening_friendly',
      thinking: 'thinking_friendly',
    },
  },
];

// services/avatar.service.ts
@Injectable()
export class AvatarService {
  async getAvatarList(): Promise<AvatarConfig[]> {
    return DEFAULT_AVATARS;
  }

  async generateAvatarVideo(
    avatarId: string,
    text: string,
    audioBuffer?: Buffer,
  ): Promise<Buffer> {
    // 调用D-ID API或自研方案生成数字人视频
  }
}
```

---

## 3. 前端开发模块

### 3.1 M-FE-01: 场景选择页面 ✅ 已完成

**模块描述：** 面试场景选择页面，包含场景卡片、岗位选择、难度配置

**文件结构：**
```
frontend/src/Interview/
├── components/
│   └── SceneSelector/
│       ├── index.tsx                # ✅ 主组件
│       ├── SceneCard.tsx            # ✅ 场景卡片组件
│       ├── JobTypeSelect.tsx        # ✅ 岗位选择组件
│       ├── DifficultySelect.tsx     # ✅ 难度选择组件
│       ├── ResumeToggle.tsx         # ✅ 简历关联组件
│       └── styles.ts                # ✅ 样式定义
└── hooks/
    └── useScenes.ts                 # ✅ 场景数据Hook
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-01-01 | 创建页面主组件 | index.tsx | 2h | ✅ |
| T-FE-01-02 | 实现场景卡片组件 | SceneCard.tsx | 2h | ✅ |
| T-FE-01-03 | 实现岗位选择组件 | JobTypeSelect.tsx | 1h | ✅ |
| T-FE-01-04 | 实现难度选择组件 | DifficultySelect.tsx | 1h | ✅ |
| T-FE-01-05 | 实现简历关联组件 | ResumeToggle.tsx | 1.5h | ✅ |
| T-FE-01-06 | 实现场景数据Hook | useScenes.ts | 1h | ✅ |
| T-FE-01-07 | 实现样式和响应式 | styles.ts | 2h | ✅ |
| T-FE-01-08 | 集成API调用 | - | 1.5h | ✅ |

---

### 3.2 M-FE-02: 面试对话页面 ✅ 已完成

**模块描述：** 面试对话主页面，包含消息列表、输入框、评估展示

**文件结构：**
```
frontend/src/Interview/
├── components/
│   └── ChatInterface/
│       ├── index.tsx                # ✅ 主组件
│       ├── MessageList.tsx          # ✅ 消息列表组件
│       ├── MessageItem.tsx          # ✅ 消息项组件
│       ├── InputArea.tsx            # ✅ 输入区域组件
│       ├── EvaluationCard.tsx       # ✅ 评估卡片组件
│       ├── ProgressBar.tsx          # ✅ 进度条组件
│       ├── Timer.tsx                # ✅ 计时器组件
│       └── styles.ts                # ✅ 样式定义
└── hooks/
    ├── useInterviewSession.ts       # ✅ 会话管理Hook
    └── useInterviewStream.ts        # ✅ 流式响应Hook
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-02-01 | 创建页面主组件 | index.tsx | 3h | ✅ |
| T-FE-02-02 | 实现消息列表组件 | MessageList.tsx | 2h | ✅ |
| T-FE-02-03 | 实现消息项组件 | MessageItem.tsx | 2h | ✅ |
| T-FE-02-04 | 实现输入区域组件 | InputArea.tsx | 2h | ✅ |
| T-FE-02-05 | 实现评估卡片组件 | EvaluationCard.tsx | 2h | ✅ |
| T-FE-02-06 | 实现进度条组件 | ProgressBar.tsx | 1h | ✅ |
| T-FE-02-07 | 实现计时器组件 | Timer.tsx | 1h | ✅ |
| T-FE-02-08 | 实现流式响应Hook | useInterviewStream.ts | 3h | ✅ |
| T-FE-02-09 | 实现会话管理Hook | useInterviewSession.ts | 2h | ✅ |
| T-FE-02-10 | 实现Markdown渲染 | - | 2h | ✅ |

---

### 3.3 M-FE-03: 面试报告页面 ✅ 已完成

**模块描述：** 展示面试评估报告，包含评分、分析、建议

**文件结构：**
```
frontend/src/Interview/
├── components/
│   └── ReportView/
│       ├── index.tsx                # ✅ 主组件
│       ├── ScoreOverview.tsx        # ✅ 评分概览组件
│       ├── RadarChart.tsx           # ✅ 雷达图组件
│       ├── DimensionAnalysis.tsx    # ✅ 维度分析组件
│       ├── StrengthsCard.tsx        # ✅ 优势卡片组件
│       ├── WeaknessesCard.tsx       # ✅ 劣势卡片组件
│       ├── SuggestionsCard.tsx      # ✅ 建议卡片组件
│       ├── QuestionReview.tsx       # ✅ 问题回顾组件
│       └── styles.ts                # ✅ 样式定义
└── hooks/
    └── useInterviewReport.ts        # ✅ 报告数据Hook
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-03-01 | 创建页面主组件 | index.tsx | 2h | ✅ |
| T-FE-03-02 | 实现评分概览组件 | ScoreOverview.tsx | 2h | ✅ |
| T-FE-03-03 | 实现雷达图组件 | RadarChart.tsx | 3h | ✅ |
| T-FE-03-04 | 实现维度分析组件 | DimensionAnalysis.tsx | 2h | ✅ |
| T-FE-03-05 | 实现优势/劣势卡片 | StrengthsCard.tsx, WeaknessesCard.tsx | 2h | ✅ |
| T-FE-03-06 | 实现建议卡片组件 | SuggestionsCard.tsx | 1.5h | ✅ |
| T-FE-03-07 | 实现问题回顾组件 | QuestionReview.tsx | 2h | ✅ |
| T-FE-03-08 | 实现PDF导出功能 | - | 2h | ✅ |
| T-FE-03-09 | 实现报告数据Hook | useInterviewReport.ts | 1.5h | ✅ |

---

### 3.4 M-FE-04: 历史记录页面 ✅ 已完成

**模块描述：** 展示历史面试记录列表

**文件结构：**
```
frontend/src/Interview/
├── components/
│   └── HistoryList/
│       ├── index.tsx                # ✅ 主组件
│       ├── HistoryItem.tsx          # ✅ 记录项组件
│       ├── FilterBar.tsx            # ✅ 筛选栏组件
│       └── styles.ts                # ✅ 样式定义
└── hooks/
    └── useInterviewHistory.ts       # ✅ 历史数据Hook
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-04-01 | 创建页面主组件 | index.tsx | 2h | ✅ |
| T-FE-04-02 | 实现记录项组件 | HistoryItem.tsx | 2h | ✅ |
| T-FE-04-03 | 实现筛选栏组件 | FilterBar.tsx | 1.5h | ✅ |
| T-FE-04-04 | 实现分页功能 | - | 1h | ✅ |
| T-FE-04-05 | 实现历史数据Hook | useInterviewHistory.ts | 1.5h | ✅ |

---

### 3.5 M-FE-05: 公共组件模块 ✅ 已完成

**模块描述：** 可复用的UI组件

**文件结构：**
```
frontend/src/Interview/
├── components/
│   └── common/
│       ├── Button.tsx               # ✅ 按钮组件
│       ├── Card.tsx                 # ✅ 卡片组件
│       ├── Modal.tsx                # ✅ 弹窗组件
│       ├── Loading.tsx              # ✅ 加载组件
│       ├── Empty.tsx                # ✅ 空状态组件
│       └── Toast.tsx                # ✅ 提示组件
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-05-01 | 实现按钮组件 | Button.tsx | 1h | ✅ |
| T-FE-05-02 | 实现卡片组件 | Card.tsx | 1h | ✅ |
| T-FE-05-03 | 实现弹窗组件 | Modal.tsx | 2h | ✅ |
| T-FE-05-04 | 实现加载组件 | Loading.tsx | 1h | ✅ |
| T-FE-05-05 | 实现空状态组件 | Empty.tsx | 1h | ✅ |
| T-FE-05-06 | 实现提示组件 | Toast.tsx | 1h | ✅ |
| T-FE-05-07 | 实现样式主题 | - | 1h | ✅ |

---

### 3.6 M-FE-06: 状态管理模块 ✅ 已完成

**模块描述：** 全局状态管理和Context

**文件结构：**
```
frontend/src/Interview/
├── context/
│   └── InterviewContext.tsx         # ✅ 面试上下文
├── hooks/
│   ├── useInterview.ts              # ✅ 面试操作Hook
│   └── useInterviewState.ts         # ✅ 面试状态Hook
└── types/
    └── index.ts                     # ✅ 类型定义
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-06-01 | 定义TypeScript类型 | types/index.ts | 2h | ✅ |
| T-FE-06-02 | 创建Interview Context | InterviewContext.tsx | 2h | ✅ |
| T-FE-06-03 | 实现面试操作Hook | useInterview.ts | 2h | ✅ |
| T-FE-06-04 | 实现面试状态Hook | useInterviewState.ts | 1h | ✅ |
| T-FE-06-05 | 集成到应用 | - | 1h | ✅ |

---

### 3.7 M-FE-07: 工具函数模块 ✅ 已完成

**模块描述：** 通用工具函数

**文件结构：**
```
frontend/src/Interview/
└── utils/
    ├── api.ts                       # ✅ API请求封装
    ├── format.ts                    # ✅ 格式化函数
    ├── storage.ts                   # ✅ 本地存储
    └── constants.ts                 # ✅ 常量定义
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-07-01 | 封装API请求函数 | api.ts | 1.5h | ✅ |
| T-FE-07-02 | 实现格式化函数 | format.ts | 1h | ✅ |
| T-FE-07-03 | 实现存储函数 | storage.ts | 0.5h | ✅ |
| T-FE-07-04 | 定义常量 | constants.ts | 1h | ✅ |

---

### 3.8 M-FE-08: 语音输入组件 ✅ 已完成

**模块描述：** 在文字对话面试中提供语音输入功能，支持录音、波形动画与 ASR 识别

**实际文件结构：**
```
frontend/src/Interview/
└── VoiceInput.tsx           # ✅ 语音输入组件（含录音/波形/ASR集成）
    # 样式集成到 Interview.scss
```

> 注：实际合并为单文件实现，未单独拆分 AudioRecorder / WaveformVisualizer。

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-08-01 | 实现音频录制功能 | VoiceInput.tsx (MediaRecorder) | 2h | ✅ |
| T-FE-08-02 | 实现波形可视化 | VoiceInput.tsx (Web Audio API) | 2h | ✅ |
| T-FE-08-03 | 实现语音输入UI | VoiceInput.tsx | 2h | ✅ |
| T-FE-08-04 | 集成语音识别API | 调用后端 /speech-to-text | 1h | ✅ |
| T-FE-08-05 | 添加权限处理 | 麦克风权限申请 | 1h | ✅ |

**核心代码：**

```typescript
// components/VoiceInput/AudioRecorder.ts
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    
    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.audioChunks = [];
          resolve(audioBlob);
        };
        this.mediaRecorder.stop();
      }
    });
  }
}
```

---

### 3.9 M-FE-09: 语音通话页面 ✅ 已完成

**模块描述：** AI语音通话面试页面，实现纯语音交互（ASR → LLM → TTS 全链路）

**实际文件结构：**
```
frontend/src/Interview/
├── VoiceInterview.tsx       # ✅ 语音通话主页面（含通话状态/波形动画/字幕）
└── InterviewModule.tsx      # ✅ VoiceInterviewLoader 封装启动流程
```

> 注：通过 SSE 启动会话而非 WebSocket；开场白TTS播放后进入正式通话流程。

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-09-01 | 实现会话启动（SSE替代WebSocket） | VoiceInterviewLoader | 3h | ✅ |
| T-FE-09-02 | 实现录音+ASR转写 | VoiceInterview.tsx | 4h | ✅ |
| T-FE-09-03 | 实现通话状态管理 | 通话/录音/AI说话状态机 | 2h | ✅ |
| T-FE-09-04 | 实现TTS音频播放 | Base64 → AudioContext | 2h | ✅ |
| T-FE-09-05 | 实现字幕显示 | 字幕渐入动画 | 2h | ✅ |
| T-FE-09-06 | 实现静音控制 | 麦克风开关 | 1h | ✅ |
| T-FE-09-07 | 编写样式文件 | Interview.scss（语音模块段） | 2h | ✅ |

**核心代码：**

```typescript
// pages/VoiceInterview/useVoiceSession.ts
export function useVoiceSession(sessionId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(`wss://api.example.com/interview/voice-session/${sessionId}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };

    wsRef.current = ws;
  }, [sessionId]);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        data: { audio: arrayBufferToBase64(audioData) },
      }));
    }
  }, []);

  return { isConnected, isSpeaking, transcript, connect, sendAudio };
}
```

---

### 3.10 M-FE-10: 视频面试页面 🆕 待开发

**模块描述：** AI视频面试页面，包含虚拟面试官和用户视频

**文件结构：**
```
frontend/src/Interview/
└── pages/
    └── VideoInterview/
        ├── VideoInterview.tsx       # 🆕 视频面试页面
        ├── VideoInterview.scss      # 🆕 样式文件
        ├── useVideoSession.ts       # 🆕 视频会话Hook
        └── components/
            ├── AvatarRenderer.tsx   # 🆕 数字人渲染组件
            ├── UserVideo.tsx        # 🆕 用户视频组件
            ├── AvatarSelector.tsx   # 🆕 面试官选择器
            └── DeviceSettings.tsx   # 🆕 设备设置面板
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-10-01 | 实现WebRTC连接 | useVideoSession.ts | 4h | 🆕 |
| T-FE-10-02 | 实现用户视频采集 | UserVideo.tsx | 2h | 🆕 |
| T-FE-10-03 | 实现数字人渲染 | AvatarRenderer.tsx | 6h | 🆕 |
| T-FE-10-04 | 实现唇形同步 | 音频驱动动画 | 4h | 🆕 |
| T-FE-10-05 | 实现面试官选择 | AvatarSelector.tsx | 2h | 🆕 |
| T-FE-10-06 | 实现设备设置 | DeviceSettings.tsx | 2h | 🆕 |
| T-FE-10-07 | 编写样式文件 | VideoInterview.scss | 4h | 🆕 |

**核心代码：**

```typescript
// pages/VideoInterview/AvatarRenderer.tsx
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const AvatarRenderer: React.FC<{ avatarId: string; isSpeaking: boolean }> = ({
  avatarId,
  isSpeaking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    const loader = new GLTFLoader();
    loader.load(`/avatars/${avatarId}.glb`, (gltf) => {
      scene.add(gltf.scene);
      mixerRef.current = new THREE.AnimationMixer(gltf.scene);
      
      // 播放待机动画
      const idleAction = mixerRef.current.clipAction(gltf.animations[0]);
      idleAction.play();
    });

    camera.position.set(0, 1.6, 3);
    camera.lookAt(0, 1.6, 0);

    containerRef.current.appendChild(renderer.domElement);

    const animate = () => {
      requestAnimationFrame(animate);
      mixerRef.current?.update(0.016);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
    };
  }, [avatarId]);

  return <div ref={containerRef} className="avatar-container" />;
};
```

---

### 3.11 M-FE-11: 面试形式选择 ✅ 已完成

**模块描述：** 面试形式选择组件，集成到场景选择页面（文字/语音/视频三种模式）

**实际文件结构：**
```
frontend/src/Interview/
└── InterviewModeSelector.tsx  # ✅ 形式选择组件（含设备检测）
    # 样式集成到 Interview.scss
```

**详细任务：**

| 任务ID | 任务描述 | 交付物 | 工时 | 状态 |
|--------|---------|--------|------|------|
| T-FE-11-01 | 实现形式选择UI | InterviewModeSelector.tsx | 2h | ✅ |
| T-FE-11-02 | 添加设备检测 | 检测摄像头/麦克风可用性 | 1h | ✅ |
| T-FE-11-03 | 编写样式文件 | Interview.scss（ModeSelector段） | 1h | ✅ |

**核心代码：**

```typescript
// components/InterviewModeSelector/InterviewModeSelector.tsx
export interface InterviewMode {
  code: 'text' | 'voice' | 'video';
  name: string;
  description: string;
  icon: string;
  requirements: string[];
  available: boolean;
}

export const InterviewModeSelector: React.FC<{
  value: InterviewMode['code'];
  onChange: (mode: InterviewMode['code']) => void;
}> = ({ value, onChange }) => {
  const [modes, setModes] = useState<InterviewMode[]>([
    {
      code: 'text',
      name: '文字对话',
      description: '纯文字交互，支持语音输入',
      icon: '💬',
      requirements: [],
      available: true,
    },
    {
      code: 'voice',
      name: '语音通话',
      description: '纯语音交互，模拟电话面试',
      icon: '📞',
      requirements: ['麦克风'],
      available: false,
    },
    {
      code: 'video',
      name: '视频面试',
      description: '视频通话，含虚拟面试官',
      icon: '📹',
      requirements: ['摄像头', '麦克风'],
      available: false,
    },
  ]);

  useEffect(() => {
    checkDeviceAvailability();
  }, []);

  const checkDeviceAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(d => d.kind === 'audioinput');
      const hasCamera = devices.some(d => d.kind === 'videoinput');

      setModes(prev => prev.map(mode => ({
        ...mode,
        available: mode.code === 'text' || 
          (mode.code === 'voice' && hasMicrophone) ||
          (mode.code === 'video' && hasMicrophone && hasCamera),
      })));
    } catch {
      // 设备检测失败
    }
  };

  return (
    <div className="interview-mode-selector">
      {modes.map(mode => (
        <div
          key={mode.code}
          className={`mode-card ${value === mode.code ? 'selected' : ''} ${!mode.available ? 'disabled' : ''}`}
          onClick={() => mode.available && onChange(mode.code)}
        >
          <span className="mode-icon">{mode.icon}</span>
          <span className="mode-name">{mode.name}</span>
          <span className="mode-desc">{mode.description}</span>
          {!mode.available && (
            <span className="mode-warning">需要{mode.requirements.join('和')}</span>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

### 3.12 M-FE-12: 面试进度保存与恢复优化 ✅ 已完成（Bug修复）

**模块描述：** 修复面试期间频繁调用进度保存接口、退出后计时暂停、返回后对话列表为空等问题

**涉及文件：**
```
frontend/src/Interview/
├── InterviewChat.tsx        # ✅ 计时器与进度保存逻辑重构
├── InterviewModule.tsx      # ✅ 面试状态管理与恢复逻辑修复
└── Interview.scss           # ✅ 新增 .header-right / .elapsed-time 样式
```

**问题与修复：**

| 问题 | 根因 | 修复方案 |
|------|------|----------|
| 每秒调用 `save-progress` 接口 | `useEffect` 依赖 `saveProgress`，导致每次渲染重新挂载 | 改为依赖空数组 `[]`，进度保存仅在组件卸载/每30s/`beforeunload` 触发 |
| 退出面试后计时暂停 | `elapsedTime` 仅存在组件内，退出时销毁；父组件未同步最新值 | 新增 `onElapsedTimeChange` prop，计时器每秒通过 ref 实时通知父组件 |
| 返回面试后对话列表为空 | `handleBackToList` 清空了 `currentSessionId`，重进时走 `startInterview` 而非 `loadMessages` | `handleBackToList` 不再清空 `currentInterview` / `currentSessionId`；`handleResumeInterview` 同一面试直接复用状态 |
| 新建面试残留旧 sessionId | `handleStartNewInterview` 未清空状态 | 开始新面试时显式清空所有面试状态 |

---

## 4. 模块依赖关系

### 4.1 后端模块依赖

```
                              M-BE-08 控制器层
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            M-BE-03 会话管理  M-BE-04 消息处理  M-BE-07 报告服务
                    │               │               │
                    │       ┌───────┴───────┐       │
                    │       │               │       │
                    │       ▼               ▼       │
                    │  M-BE-05 LLM服务  M-BE-06 评估│
                    │       │               │       │
                    └───────┴───────┬───────┴───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            M-BE-09 语音识别  M-BE-10 语音合成  M-BE-12 数字人
                                    │
                                    ▼
                            M-BE-11 视频处理
                                    │
                                    ▼
                            M-BE-01 数据模型
                                    │
                                    ▼
                            M-BE-02 场景管理
```

### 4.2 前端模块依赖

```
  M-FE-01 场景选择    M-FE-02 面试对话    M-FE-03 面试报告    M-FE-04 历史记录
         │                   │                   │                   │
         │                   │                   │                   │
         ▼                   ▼                   │                   │
  M-FE-11 形式选择    M-FE-08 语音输入         │                   │
         │                   │                   │                   │
         │                   │                   │                   │
         └───────────────────┼───────────────────┼───────────────────┘
                             │                   │
                             ▼                   ▼
                       M-FE-06 状态管理    M-FE-07 工具函数
                             │                   │
                             └─────────┬─────────┘
                                       │
                                       ▼
                               M-FE-05 公共组件

  M-FE-09 语音通话页面    M-FE-10 视频面试页面
         │                        │
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
              M-FE-08 语音输入组件
                      │
                      ▼
              M-FE-05 公共组件
```

### 4.3 新增模块依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                    新增功能模块依赖                              │
└─────────────────────────────────────────────────────────────────┘

语音输入功能:
  M-FE-08 (语音输入组件) ──依赖──▶ M-BE-09 (语音识别服务)

语音通话功能:
  M-FE-09 (语音通话页面) ──依赖──▶ M-BE-09 (语音识别服务)
                              ──依赖──▶ M-BE-10 (语音合成服务)

视频面试功能:
  M-FE-10 (视频面试页面) ──依赖──▶ M-BE-09 (语音识别服务)
                              ──依赖──▶ M-BE-10 (语音合成服务)
                              ──依赖──▶ M-BE-11 (视频处理服务)
                              ──依赖──▶ M-BE-12 (数字人服务)
```

---

## 5. 开发顺序建议

### 5.1 Sprint 1 (Week 1-2): 基础架构

**目标：** 完成数据模型和场景选择功能

**后端任务：**
```
Day 1-2:  M-BE-01 数据模型模块
Day 3:    M-BE-02 场景管理模块
Day 4-5:  M-BE-03 会话管理模块（部分）
Day 6-8:  M-BE-08 控制器层模块（场景相关接口）
```

**前端任务：**
```
Day 1-2:  M-FE-06 状态管理模块（类型定义）
Day 3-4:  M-FE-05 公共组件模块
Day 5-8:  M-FE-01 场景选择页面
Day 9-10: M-FE-07 工具函数模块
```

### 5.2 Sprint 2 (Week 3-4): 面试对话核心

**目标：** 完成面试对话核心功能

**后端任务：**
```
Day 1-4:  M-BE-05 LLM服务模块
Day 5-6:  M-BE-06 评估服务模块
Day 7-8:  M-BE-04 消息处理模块
Day 9-10: M-BE-08 控制器层模块（消息相关接口）
```

**前端任务：**
```
Day 1-3:  M-FE-06 状态管理模块（完善）
Day 4-8:  M-FE-02 面试对话页面
Day 9-10: 集成测试和Bug修复
```

### 5.3 Sprint 3 (Week 5-6): 评估与报告

**目标：** 完成评估和报告功能

**后端任务：**
```
Day 1-3:  M-BE-07 报告服务模块
Day 4-5:  M-BE-08 控制器层模块（报告相关接口）
Day 6-8:  单元测试编写
Day 9-10: 性能优化
```

**前端任务：**
```
Day 1-5:  M-FE-03 面试报告页面
Day 6-8:  M-FE-04 历史记录页面
Day 9-10: 集成测试和Bug修复
```

### 5.4 Sprint 4 (Week 7-8): 完善优化

**目标：** 完善功能，准备发布

**任务：**
```
Day 1-3:  简历关联功能完善
Day 4-5:  E2E测试
Day 6-7:  性能优化和Bug修复
Day 8:    文档完善
Day 9-10: 发布准备
```

### 5.5 Sprint 5 (Week 9-11): 语音功能 🆕

**目标：** 完成语音输入和语音通话功能

**后端任务：**
```
Day 1-3:  M-BE-09 语音识别服务(ASR)
Day 4-5:  M-BE-10 语音合成服务(TTS)
Day 6-7:  WebSocket语音会话接口
Day 8-9:  单元测试编写
Day 10-11: 集成测试
```

**前端任务：**
```
Day 1-2:  M-FE-11 面试形式选择组件
Day 3-4:  M-FE-08 语音输入组件
Day 5-8:  M-FE-09 语音通话页面
Day 9-10: 集成测试和Bug修复
Day 11:   性能优化
```

### 5.6 Sprint 6 (Week 12-14): 视频面试 🆕

**目标：** 完成AI视频面试功能

**后端任务：**
```
Day 1-3:  M-BE-11 视频处理服务
Day 4-7:  M-BE-12 数字人服务
Day 8-10: WebRTC信令服务
Day 11-12: 单元测试编写
Day 13-14: 集成测试
```

**前端任务：**
```
Day 1-2:  用户视频采集组件
Day 3-6:  数字人渲染组件
Day 7-8:  唇形同步实现
Day 9-10: M-FE-10 视频面试页面整合
Day 11-12: 设备设置面板
Day 13-14: 集成测试和Bug修复
```

---

## 6. 任务清单

### 6.1 后端任务清单

| 任务ID | 模块 | 任务描述 | 优先级 | 状态 |
|--------|------|---------|--------|------|
| T-BE-01-01 | M-BE-01 | 创建Interview实体类 | P0 | ✅ 已完成 |
| T-BE-01-02 | M-BE-01 | 创建InterviewSession实体类 | P0 | ✅ 已完成 |
| T-BE-01-03 | M-BE-01 | 创建InterviewMessage实体类 | P0 | ✅ 已完成 |
| T-BE-01-04 | M-BE-01 | 创建InterviewReport实体类 | P0 | ✅ 已完成 |
| T-BE-01-05 | M-BE-01 | 创建CreateInterviewDTO | P0 | ✅ 已完成 |
| T-BE-01-06 | M-BE-01 | 创建SendMessageDTO | P0 | ✅ 已完成 |
| T-BE-01-07 | M-BE-01 | 创建响应DTO类 | P0 | ✅ 已完成 |
| T-BE-01-08 | M-BE-01 | 定义场景/岗位/难度常量 | P0 | ✅ 已完成 |
| T-BE-01-09 | M-BE-01 | 配置实体关系和索引 | P0 | ✅ 已完成 |
| T-BE-02-01 | M-BE-02 | 定义场景配置数据结构 | P0 | ✅ 已完成 |
| T-BE-02-02 | M-BE-02 | 实现场景列表查询方法 | P0 | ✅ 已完成 |
| T-BE-02-03 | M-BE-02 | 实现岗位类型查询方法 | P0 | ✅ 已完成 |
| T-BE-02-04 | M-BE-02 | 实现难度等级查询方法 | P0 | ✅ 已完成 |
| T-BE-02-05 | M-BE-02 | 编写单元测试 | P1 | ✅ 已完成 |
| T-BE-03-01 | M-BE-03 | 实现创建面试方法 | P0 | ✅ 已完成 |
| T-BE-03-02 | M-BE-03 | 实现获取面试列表方法 | P0 | ✅ 已完成 |
| T-BE-03-03 | M-BE-03 | 实现获取面试详情方法 | P0 | ✅ 已完成 |
| T-BE-03-04 | M-BE-03 | 实现开始面试会话方法 | P0 | ✅ 已完成 |
| T-BE-03-05 | M-BE-03 | 实现结束面试方法 | P0 | ✅ 已完成 |
| T-BE-03-06 | M-BE-03 | 实现恢复中断面试方法 | P1 | ✅ 已完成 |
| T-BE-03-07 | M-BE-03 | 实现删除面试方法 | P1 | ✅ 已完成 |
| T-BE-04-01 | M-BE-04 | 实现保存消息方法 | P0 | ✅ 已完成 |
| T-BE-04-02 | M-BE-04 | 实现获取消息历史方法 | P0 | ✅ 已完成 |
| T-BE-04-03 | M-BE-04 | 实现流式消息处理方法 | P0 | ✅ 已完成 |
| T-BE-04-04 | M-BE-04 | 实现消息格式转换方法 | P0 | ✅ 已完成 |
| T-BE-04-05 | M-BE-04 | 实现SSE响应封装 | P0 | ✅ 已完成 |
| T-BE-05-01 | M-BE-05 | 实现开场白生成方法 | P0 | ✅ 已完成 |
| T-BE-05-02 | M-BE-05 | 实现问题生成方法 | P0 | ✅ 已完成 |
| T-BE-05-03 | M-BE-05 | 实现追问生成方法 | P0 | ✅ 已完成 |
| T-BE-05-04 | M-BE-05 | 实现结束语生成方法 | P0 | ✅ 已完成 |
| T-BE-05-05 | M-BE-05 | 实现流式聊天方法 | P0 | ✅ 已完成 |
| T-BE-05-06 | M-BE-05 | 设计和实现Prompt模板 | P0 | ✅ 已完成 |
| T-BE-05-07 | M-BE-05 | 实现简历上下文注入 | P1 | ✅ 已完成 |
| T-BE-06-01 | M-BE-06 | 实现单题评估方法 | P0 | ✅ 已完成 |
| T-BE-06-02 | M-BE-06 | 实现维度评分计算 | P0 | ✅ 已完成 |
| T-BE-06-03 | M-BE-06 | 实现改进建议生成 | P0 | ✅ 已完成 |
| T-BE-06-04 | M-BE-06 | 实现追问判断逻辑 | P0 | ✅ 已完成 |
| T-BE-06-05 | M-BE-06 | 实现综合评分计算 | P0 | ✅ 已完成 |
| T-BE-06-06 | M-BE-06 | 设计评估Prompt模板 | P0 | ✅ 已完成 |
| T-BE-07-01 | M-BE-07 | 实现报告生成方法 | P0 | ✅ 已完成 |
| T-BE-07-02 | M-BE-07 | 实现维度评分汇总 | P0 | ✅ 已完成 |
| T-BE-07-03 | M-BE-07 | 实现优势分析生成 | P0 | ✅ 已完成 |
| T-BE-07-04 | M-BE-07 | 实现劣势分析生成 | P0 | ✅ 已完成 |
| T-BE-07-05 | M-BE-07 | 实现学习建议生成 | P0 | ✅ 已完成 |
| T-BE-07-06 | M-BE-07 | 实现报告查询方法 | P0 | ✅ 已完成 |
| T-BE-08-01 | M-BE-08 | 实现场景相关接口 | P0 | ✅ 已完成 |
| T-BE-08-02 | M-BE-08 | 实现面试CRUD接口 | P0 | ✅ 已完成 |
| T-BE-08-03 | M-BE-08 | 实现会话控制接口 | P0 | ✅ 已完成 |
| T-BE-08-04 | M-BE-08 | 实现消息发送接口 | P0 | ✅ 已完成 |
| T-BE-08-05 | M-BE-08 | 实现流式响应接口 | P0 | ✅ 已完成 |
| T-BE-08-06 | M-BE-08 | 实现报告查询接口 | P0 | ✅ 已完成 |
| T-BE-09-01 | M-BE-09 | 集成 Whisper API (Axios) | P1 | ✅ 已完成 |
| T-BE-09-02 | M-BE-09 | 实现音频文件上传识别 | P1 | ✅ 已完成 |
| T-BE-09-03 | M-BE-09 | 实现实时流式语音识别 | P1 | 🔄 降级/暂缓 |
| T-BE-09-04 | M-BE-09 | 实现VAD语音活动检测 | P1 | ⏸️ 暂缓 |
| T-BE-09-05 | M-BE-09 | 添加音频格式转换 | P1 | ✅ 已完成 |
| T-BE-09-06 | M-BE-09 | 编写单元测试 | P1 | ⏸️ 暂缓 |
| T-BE-10-01 | M-BE-10 | 集成 TTS API (Axios) | P1 | ✅ 已完成 |
| T-BE-10-02 | M-BE-10 | 实现文本转语音接口 | P1 | ✅ 已完成 |
| T-BE-10-03 | M-BE-10 | 实现流式语音合成 | P1 | ⏸️ 暂缓 |
| T-BE-10-04 | M-BE-10 | 支持多音色选择 | P1 | ✅ 已完成 |
| T-BE-10-05 | M-BE-10 | 实现语音缓存机制 | P2 | ⏸️ 暂缓 |
| T-BE-11-01 | M-BE-11 | 实现WebRTC信令服务 | P2 | 🆕 待开发 |
| T-BE-11-02 | M-BE-11 | 实现视频流接收 | P2 | 🆕 待开发 |
| T-BE-11-03 | M-BE-11 | 实现视频帧提取 | P2 | 🆕 待开发 |
| T-BE-11-04 | M-BE-11 | 实现视频存储 | P2 | 🆕 待开发 |
| T-BE-11-05 | M-BE-11 | 实现视频回放接口 | P2 | 🆕 待开发 |
| T-BE-11-06 | M-BE-11 | 编写单元测试 | P2 | 🆕 待开发 |
| T-BE-12-01 | M-BE-12 | 定义数字人配置结构 | P2 | 🆕 待开发 |
| T-BE-12-02 | M-BE-12 | 集成D-ID API或自研方案 | P2 | 🆕 待开发 |
| T-BE-12-03 | M-BE-12 | 实现唇形同步 | P2 | 🆕 待开发 |
| T-BE-12-04 | M-BE-12 | 实现表情动画系统 | P2 | 🆕 待开发 |
| T-BE-12-05 | M-BE-12 | 实现数字人视频生成 | P2 | 🆕 待开发 |
| T-BE-12-06 | M-BE-12 | 编写单元测试 | P2 | 🆕 待开发 |

### 6.2 前端任务清单

| 任务ID | 模块 | 任务描述 | 优先级 | 状态 |
|--------|------|---------|--------|------|
| T-FE-01-01 | M-FE-01 | 创建页面主组件 | P0 | ✅ 已完成 |
| T-FE-01-02 | M-FE-01 | 实现场景卡片组件 | P0 | ✅ 已完成 |
| T-FE-01-03 | M-FE-01 | 实现岗位选择组件 | P0 | ✅ 已完成 |
| T-FE-01-04 | M-FE-01 | 实现难度选择组件 | P0 | ✅ 已完成 |
| T-FE-01-05 | M-FE-01 | 实现简历关联组件 | P1 | ✅ 已完成 |
| T-FE-01-06 | M-FE-01 | 实现场景数据Hook | P0 | ✅ 已完成 |
| T-FE-01-07 | M-FE-01 | 实现样式和响应式 | P0 | ✅ 已完成 |
| T-FE-02-01 | M-FE-02 | 创建页面主组件 | P0 | ✅ 已完成 |
| T-FE-02-02 | M-FE-02 | 实现消息列表组件 | P0 | ✅ 已完成 |
| T-FE-02-03 | M-FE-02 | 实现消息项组件 | P0 | ✅ 已完成 |
| T-FE-02-04 | M-FE-02 | 实现输入区域组件 | P0 | ✅ 已完成 |
| T-FE-02-05 | M-FE-02 | 实现评估卡片组件 | P0 | ✅ 已完成 |
| T-FE-02-06 | M-FE-02 | 实现进度条组件 | P0 | ✅ 已完成 |
| T-FE-02-07 | M-FE-02 | 实现计时器组件 | P1 | ✅ 已完成 |
| T-FE-02-08 | M-FE-02 | 实现流式响应Hook | P0 | ✅ 已完成 |
| T-FE-02-09 | M-FE-02 | 实现会话管理Hook | P0 | ✅ 已完成 |
| T-FE-03-01 | M-FE-03 | 创建页面主组件 | P0 | ✅ 已完成 |
| T-FE-03-02 | M-FE-03 | 实现评分概览组件 | P0 | ✅ 已完成 |
| T-FE-03-03 | M-FE-03 | 实现雷达图组件 | P0 | ✅ 已完成 |
| T-FE-03-04 | M-FE-03 | 实现维度分析组件 | P0 | ✅ 已完成 |
| T-FE-03-05 | M-FE-03 | 实现优势/劣势卡片 | P0 | ✅ 已完成 |
| T-FE-03-06 | M-FE-03 | 实现建议卡片组件 | P0 | ✅ 已完成 |
| T-FE-03-07 | M-FE-03 | 实现问题回顾组件 | P0 | ✅ 已完成 |
| T-FE-03-08 | M-FE-03 | 实现PDF导出功能 | P1 | ✅ 已完成 |
| T-FE-04-01 | M-FE-04 | 创建页面主组件 | P1 | ✅ 已完成 |
| T-FE-04-02 | M-FE-04 | 实现记录项组件 | P1 | ✅ 已完成 |
| T-FE-04-03 | M-FE-04 | 实现筛选栏组件 | P1 | ✅ 已完成 |
| T-FE-04-04 | M-FE-04 | 实现分页功能 | P1 | ✅ 已完成 |
| T-FE-05-01 | M-FE-05 | 实现按钮组件 | P0 | ✅ 已完成 |
| T-FE-05-02 | M-FE-05 | 实现卡片组件 | P0 | ✅ 已完成 |
| T-FE-05-03 | M-FE-05 | 实现弹窗组件 | P0 | ✅ 已完成 |
| T-FE-05-04 | M-FE-05 | 实现加载组件 | P0 | ✅ 已完成 |
| T-FE-05-05 | M-FE-05 | 实现空状态组件 | P0 | ✅ 已完成 |
| T-FE-06-01 | M-FE-06 | 定义TypeScript类型 | P0 | ✅ 已完成 |
| T-FE-06-02 | M-FE-06 | 创建Interview Context | P0 | ✅ 已完成 |
| T-FE-06-03 | M-FE-06 | 实现面试操作Hook | P0 | ✅ 已完成 |
| T-FE-07-01 | M-FE-07 | 封装API请求函数 | P0 | ✅ 已完成 |
| T-FE-07-02 | M-FE-07 | 实现格式化函数 | P1 | ✅ 已完成 |
| T-FE-08-01 | M-FE-08 | 实现音频录制功能 | P1 | ✅ 已完成 |
| T-FE-08-02 | M-FE-08 | 实现波形可视化 | P1 | ✅ 已完成 |
| T-FE-08-03 | M-FE-08 | 实现语音输入UI | P1 | ✅ 已完成 |
| T-FE-08-04 | M-FE-08 | 集成语音识别API | P1 | ✅ 已完成 |
| T-FE-08-05 | M-FE-08 | 添加权限处理 | P1 | ✅ 已完成 |
| T-FE-09-01 | M-FE-09 | 实现会话启动（SSE） | P1 | ✅ 已完成 |
| T-FE-09-02 | M-FE-09 | 实现录音+ASR转写 | P1 | ✅ 已完成 |
| T-FE-09-03 | M-FE-09 | 实现通话状态管理 | P1 | ✅ 已完成 |
| T-FE-09-04 | M-FE-09 | 实现TTS音频播放 | P1 | ✅ 已完成 |
| T-FE-09-05 | M-FE-09 | 实现字幕显示 | P1 | ✅ 已完成 |
| T-FE-09-06 | M-FE-09 | 实现静音控制 | P1 | ✅ 已完成 |
| T-FE-09-07 | M-FE-09 | 编写样式文件 | P1 | ✅ 已完成 |
| T-FE-10-01 | M-FE-10 | 实现WebRTC连接 | P2 | 🆕 待开发 |
| T-FE-10-02 | M-FE-10 | 实现用户视频采集 | P2 | 🆕 待开发 |
| T-FE-10-03 | M-FE-10 | 实现数字人渲染 | P2 | 🆕 待开发 |
| T-FE-10-04 | M-FE-10 | 实现唇形同步 | P2 | 🆕 待开发 |
| T-FE-10-05 | M-FE-10 | 实现面试官选择 | P2 | 🆕 待开发 |
| T-FE-10-06 | M-FE-10 | 实现设备设置 | P2 | 🆕 待开发 |
| T-FE-10-07 | M-FE-10 | 编写样式文件 | P2 | 🆕 待开发 |
| T-FE-11-01 | M-FE-11 | 实现形式选择UI | P1 | ✅ 已完成 |
| T-FE-11-02 | M-FE-11 | 添加设备检测 | P1 | ✅ 已完成 |
| T-FE-11-03 | M-FE-11 | 编写样式文件 | P1 | ✅ 已完成 |
| T-FE-12-01 | M-FE-12 | 修复进度保存频率（每秒→每30s/退出） | P0 | ✅ 已完成 |
| T-FE-12-02 | M-FE-12 | 修复退出后计时暂停（onElapsedTimeChange同步） | P0 | ✅ 已完成 |
| T-FE-12-03 | M-FE-12 | 修复返回面试后对话为空（保留sessionId） | P0 | ✅ 已完成 |
| T-FE-12-04 | M-FE-12 | 修复新建面试残留旧sessionId | P1 | ✅ 已完成 |

---

## 附录

### A. 文件目录结构

```
backend/src/interview/
├── constants/
│   ├── scene-config.ts
│   ├── scene-types.ts
│   ├── job-types.ts
│   ├── difficulty-levels.ts
│   └── interview-status.ts
├── dto/
│   ├── create-interview.dto.ts
│   ├── update-interview.dto.ts
│   ├── send-message.dto.ts
│   ├── query-interview.dto.ts
│   ├── interview-response.dto.ts
│   ├── session-response.dto.ts
│   └── report-response.dto.ts
├── entities/
│   ├── interview.entity.ts
│   ├── interview-session.entity.ts
│   ├── interview-message.entity.ts
│   └── interview-report.entity.ts
├── services/
│   ├── scene.service.ts
│   ├── interview-session.service.ts
│   ├── interview-message.service.ts
│   ├── interview-llm.service.ts
│   ├── interview-evaluator.service.ts
│   ├── interview-report.service.ts
│   ├── speech-recognition.service.ts    # 🆕 语音识别
│   ├── speech-synthesis.service.ts      # 🆕 语音合成
│   ├── video-processing.service.ts      # 🆕 视频处理
│   └── avatar.service.ts                # 🆕 数字人
├── config/
│   └── avatar-config.ts                 # 🆕 数字人配置
├── interview.controller.ts
└── interview.module.ts

frontend/src/Interview/
├── InterviewModule.tsx              # ✅ 模块主入口（含 VoiceInterviewLoader）
├── InterviewChat.tsx                # ✅ 文字对话页面
├── InterviewReport.tsx              # ✅ 面试报告页面
├── VoiceInterview.tsx               # ✅ 语音通话页面（含波形/字幕/状态机）
├── VoiceInput.tsx                   # ✅ 语音输入组件（录音/波形/ASR）
├── InterviewModeSelector.tsx        # ✅ 面试形式选择组件（含设备检测）
├── Interview.scss                   # ✅ 所有模块样式（统一管理）
├── api.ts                           # ✅ 面试 API 封装
└── types.ts                         # ✅ TypeScript 类型定义
```

### B. 工时汇总

| 类型 | 原有工时 | 新增工时 | 总工时 |
|------|---------|---------|--------|
| 后端开发 | 72h | 60h | 132h |
| 前端开发 | 76h | 52h | 128h |
| 测试 | 20h | 16h | 36h |
| 文档 | 8h | 4h | 12h |
| **总计** | **176h** | **132h** | **308h** |

### C. 新增功能工时明细

| 模块 | 功能 | 后端工时 | 前端工时 | 总工时 |
|------|------|---------|---------|--------|
| 语音输入 | 文字对话+语音输入 | 12h | 8h | 20h |
| 语音通话 | AI语音通话面试 | 8h | 16h | 24h |
| 视频面试 | AI视频面试+数字人 | 40h | 28h | 68h |
| 形式选择 | 面试形式选择组件 | - | 4h | 4h |
| 测试 | 新增功能测试 | 10h | 6h | 16h |
| **合计** | | **70h** | **62h** | **132h** |

---

**文档版本历史：**

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| V1.0.0 | 2026-02-28 | 初始版本 | - |
| V1.1.0 | 2026-03-01 | 新增语音输入、语音通话、视频面试功能模块 | - |
| V1.2.0 | 2026-03-04 | 完成 M-BE-09/10/M-FE-08/09/11 语音模块；新增 M-FE-12 面试进度恢复修复 | - |
