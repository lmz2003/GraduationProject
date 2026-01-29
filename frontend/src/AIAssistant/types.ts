// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; score: number }>;
  isInitial?: boolean; // 标记为初始提示词
}

// 会话类型
export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
  messageCount: number;
}

// 会话历史记录
export interface SessionHistory {
  sessionId: string;
  messages: Message[];
}

// API响应类型
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// AI助手配置
export interface AssistantConfig {
  useRAG: boolean;
  topK: number;
  threshold: number;
}
