# RAG 知识库系统 - 集成示例

本文档展示如何使用 RAG 知识库系统与 LLM 集成，构建智能问答系统。

## 目录

1. [基础集成](#基础集成)
2. [高级功能](#高级功能)
3. [前端集成](#前端集成)
4. [完整示例](#完整示例)

## 基础集成

### 1. 简单的 RAG 查询

```typescript
// 后端控制器示例
import { Controller, Post, Body, Request } from '@nestjs/common';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { LLMIntegrationService } from './services/llm-integration.service';

@Controller('api/ai')
export class AIController {
  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private llmService: LLMIntegrationService,
  ) {}

  @Post('ask')
  async askQuestion(@Body() dto: { question: string }, @Request() req: any) {
    const userId = req.user?.id || 'test-user-id';

    // 1. 执行 RAG 查询
    const ragResult = await this.knowledgeBaseService.ragQuery(
      { query: dto.question, topK: 5, threshold: 0.5 },
      userId,
    );

    // 2. 使用 LLM 生成答案
    const answer = await this.llmService.generateRAGAnswer(ragResult);

    return {
      success: true,
      data: answer,
    };
  }
}
```

### 2. 添加文档并查询

```typescript
// 添加多个文档
const documents = [
  {
    title: 'JavaScript 异步编程',
    content: `
      JavaScript 中的异步编程是处理非阻塞操作的关键。
      主要包括三种方式：
      1. 回调函数 (Callback)
      2. Promise
      3. Async/Await
    `,
  },
  {
    title: 'Python 函数编程',
    content: `
      Python 中的函数是可重用的代码块。
      使用 def 关键字定义函数。
      支持默认参数、可变参数等高级特性。
    `,
  },
];

for (const doc of documents) {
  await knowledgeBaseService.addDocument(doc, userId);
}

// 查询知识库
const results = await knowledgeBaseService.queryKnowledge(
  { query: '如何处理异步操作？', topK: 3, threshold: 0.5 },
  userId,
);
```

## 高级功能

### 1. 文档总结

```typescript
import { Injectable } from '@nestjs/common';
import { LLMIntegrationService } from './llm-integration.service';

@Injectable()
export class DocumentSummaryService {
  constructor(private llmService: LLMIntegrationService) {}

  async summarizeUserDocuments(userId: string) {
    const documents = await this.knowledgeBaseService.getUserDocuments(userId);

    const summaries = await Promise.all(
      documents.map((doc) =>
        this.llmService.summarizeDocument(doc.content, 150),
      ),
    );

    return documents.map((doc, index) => ({
      title: doc.title,
      summary: summaries[index],
    }));
  }
}
```

### 2. 关键词提取

```typescript
async extractDocumentKeywords(documentId: string, userId: string) {
  const document = await this.knowledgeBaseService.getDocument(
    documentId,
    userId,
  );

  const keywords = await this.llmService.extractKeywords(
    document.content,
    5,
  );

  // 保存关键词到文档元数据
  await this.knowledgeBaseService.updateDocument(
    documentId,
    {
      metadata: {
        ...document.metadata,
        keywords,
      },
    },
    userId,
  );

  return keywords;
}
```

### 3. 文档分类

```typescript
async classifyDocument(documentId: string, userId: string) {
  const document = await this.knowledgeBaseService.getDocument(
    documentId,
    userId,
  );

  const categories = [
    '技术文档',
    '业务指南',
    '学习资料',
    '参考手册',
  ];

  const classification = await this.llmService.classifyDocument(
    document.content,
    categories,
  );

  // 保存分类结果
  await this.knowledgeBaseService.updateDocument(
    documentId,
    {
      metadata: {
        ...document.metadata,
        category: classification.category,
        confidence: classification.confidence,
      },
    },
    userId,
  );

  return classification;
}
```

### 4. 多轮对话

```typescript
@Controller('api/chat')
export class ChatController {
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private llmService: LLMIntegrationService,
  ) {}

  @Post('message')
  async handleChatMessage(
    @Body() dto: { message: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'test-user-id';

    // 1. 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: dto.message,
    });

    // 2. 执行 RAG 查询
    const ragResult = await this.knowledgeBaseService.ragQuery(
      { query: dto.message, topK: 3, threshold: 0.5 },
      userId,
    );

    // 3. 使用多轮对话生成答案
    const response = await this.llmService.multiTurnRAGChat(
      this.conversationHistory,
      ragResult,
    );

    // 4. 添加助手回复到历史
    this.conversationHistory.push({
      role: 'assistant',
      content: response.answer,
    });

    return {
      success: true,
      data: response,
      history: this.conversationHistory,
    };
  }

  @Post('reset')
  resetConversation() {
    this.conversationHistory = [];
    return { success: true, message: '对话已重置' };
  }
}
```

### 5. 答案质量评估

```typescript
async evaluateAnswerQuality(
  question: string,
  answer: string,
  documentId: string,
  userId: string,
) {
  const document = await this.knowledgeBaseService.getDocument(
    documentId,
    userId,
  );

  const evaluation = await this.llmService.evaluateAnswer(
    question,
    answer,
    document.content,
  );

  return {
    question,
    answer,
    evaluation,
    feedback: `答案质量评分: ${evaluation.score.toFixed(2)}/1.0\n反馈: ${evaluation.feedback}`,
  };
}
```

## 前端集成

### 1. React 组件 - 智能问答

```typescript
import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; score: number }>;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:3001/api/ai/ask',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ question: input }),
        },
      );

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          sources: data.data.contexts,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ height: '400px', overflowY: 'auto', marginBottom: '20px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '10px',
              padding: '10px',
              background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <strong>{msg.role === 'user' ? '你' : 'AI'}:</strong>
            <p>{msg.content}</p>
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                <p>来源：</p>
                {msg.sources.map((source, idx) => (
                  <p key={idx}>
                    {source.title} (相似度: {(source.score * 100).toFixed(1)}%)
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="输入你的问题..."
          style={{ flex: 1, padding: '10px' }}
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default AIChat;
```

### 2. 文档管理界面

```typescript
const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSummarize = async (docId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/documents/${docId}/summarize`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      const data = await response.json();
      setSummary(data.data.summary);
    } catch (error) {
      console.error('总结失败:', error);
    }
  };

  const handleExtractKeywords = async (docId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/documents/${docId}/keywords`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      const data = await response.json();
      setKeywords(data.data.keywords);
    } catch (error) {
      console.error('提取关键词失败:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>文档管理</h2>

      {selectedDoc && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5' }}>
          <h3>{selectedDoc.title}</h3>

          <button onClick={() => handleSummarize(selectedDoc.id)}>
            生成摘要
          </button>
          <button onClick={() => handleExtractKeywords(selectedDoc.id)}>
            提取关键词
          </button>

          {summary && (
            <div style={{ marginTop: '10px' }}>
              <h4>摘要：</h4>
              <p>{summary}</p>
            </div>
          )}

          {keywords.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4>关键词：</h4>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#4f46e5',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
```

## 完整示例

### 完整的 AI 面试官系统

```typescript
// 后端服务
@Injectable()
export class InterviewService {
  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private llmService: LLMIntegrationService,
  ) {}

  async startInterview(topic: string, userId: string) {
    // 1. 查询相关知识
    const knowledge = await this.knowledgeBaseService.queryKnowledge(
      { query: topic, topK: 5, threshold: 0.5 },
      userId,
    );

    // 2. 生成面试问题
    const context = knowledge.map((k) => k.content).join('\n');
    const questions = await this.llmService.generateQuestions(context, 5);

    return {
      topic,
      questions,
      knowledge,
    };
  }

  async evaluateAnswer(
    question: string,
    answer: string,
    topic: string,
    userId: string,
  ) {
    // 1. 查询相关知识
    const knowledge = await this.knowledgeBaseService.queryKnowledge(
      { query: question, topK: 3, threshold: 0.5 },
      userId,
    );

    // 2. 评估答案
    const context = knowledge.map((k) => k.content).join('\n');
    const evaluation = await this.llmService.evaluateAnswer(
      question,
      answer,
      context,
    );

    return {
      question,
      answer,
      evaluation,
      references: knowledge,
    };
  }
}
```

## 最佳实践

1. **缓存结果**: 缓存频繁查询的结果以提高性能
2. **错误处理**: 实现完善的错误处理和重试机制
3. **日志记录**: 记录所有 API 调用和错误
4. **速率限制**: 实施 API 调用的速率限制
5. **成本优化**: 监控 OpenAI API 的使用成本

## 故障排除

### 问题：LLM 响应缓慢
- 检查网络连接
- 减少 topK 数量
- 使用更小的模型

### 问题：答案不相关
- 增加 threshold 值
- 检查文档质量
- 调整 chunk 大小

### 问题：API 限额
- 实施缓存机制
- 减少查询频率
- 使用更经济的模型

## 参考资源

- [LangChain 文档](https://python.langchain.com/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [RAG 最佳实践](https://docs.llamaindex.ai/)