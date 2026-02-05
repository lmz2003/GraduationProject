import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AIAssistant.scss';
import MarkdownRenderer from './MarkdownRenderer';
import type { Message, Session } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const AIAssistant: React.FC = () => {
  const token = localStorage.getItem('token');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [useRAG, setUseRAG] = useState(true); // 是否使用知识库
  const [requestId, setRequestId] = useState<string | null>(null); // 后端请求 ID
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 自动调整 textarea 高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = 'auto';
    
    // 计算所需的高度，限制在四行以内
    const lineHeight = 24; // 行高 (px)
    const paddingTop = 12; // padding-top (px)
    const paddingBottom = 12; // padding-bottom (px)
    const maxLinesHeight = lineHeight * 4; // 四行的最大内容高度
    const maxHeight = maxLinesHeight + paddingTop + paddingBottom; // 总最大高度
    const scrollHeight = textarea.scrollHeight;
    
    // 当内容超过四行时，显示滚动条；否则自适应高度
    if (scrollHeight > maxHeight) {
      textarea.style.height = maxHeight + 'px';
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = scrollHeight + 'px';
      textarea.style.overflowY = 'hidden';
    }
  }, []);

  // 监听输入变化，调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // 点击外部关闭下拉菜单
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 加载历史会话
  const loadSessions = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/ai-assistant/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  }, [token]);

  // 组件挂载时加载会话
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 切换到初始状态（不创建会话）
  const createNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
  }, []);

  // 切换会话
  const switchSession = useCallback(async (sessionIdToSwitch: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/ai-assistant/sessions/${sessionIdToSwitch}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(sessionIdToSwitch);
        setMessages(data.data.messages || []);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  }, [token]);

  // 删除会话
  const deleteSession = useCallback(async (sessionToDelete: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/ai-assistant/sessions/${sessionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        loadSessions();
        // 如果删除的是当前会话，切换到初始状态
        if (sessionId === sessionToDelete) {
          createNewSession();
        }
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  }, [token, sessionId, loadSessions, createNewSession]);

  // 发送消息（流式）
  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping || !token) return;

    setError(null);
    
    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // 添加用户消息到消息列表
    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // 创建AI回复消息的ID
      const aiMessageId = (Date.now() + 1).toString();
      setStreamingMessageId(aiMessageId);

      // 关闭之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 立即创建一个空的AI消息气泡，以便用户能看到AI正在回答
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sources: [],
      }]);

      let currentContent = '';
      let currentSources: Array<{ title: string; score: number }> = [];

      // 使用 fetch 和 ReadableStream 来处理流式响应
      const response = await fetch(`${API_BASE}/ai-assistant/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userInput,
          sessionId: sessionId || undefined,
          useRAG,
          topK: 5,
          threshold: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      // 逐行读取SSE数据
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setStreamingMessageId(null);
          setRequestId(null);
          loadSessions();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // 保留最后一个不完整的行
        buffer = lines[lines.length - 1];

        // 处理完整的行
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();

          // 跳过空行
          if (!line) {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const data = JSON.parse(jsonStr);

              if (data.type === 'request-id' && data.data?.requestId) {
                // 保存后端返回的请求 ID
                setRequestId(data.data.requestId);
                console.log('📝 收到请求 ID:', data.data.requestId);
              } else if (data.type === 'chunk' && data.data) {
                // 处理可能的对象类型数据
                let chunkContent: string;
                if (typeof data.data === 'string') {
                  chunkContent = data.data;
                } else if (typeof data.data === 'object' && data.data !== null) {
                  // 如果是对象，尝试提取内容或转换为JSON
                  if ('content' in data.data && typeof (data.data as any).content === 'string') {
                    chunkContent = (data.data as any).content;
                  } else if ('kwargs' in data.data && (data.data as any).kwargs) {
                    // 处理 langchain 的 AIMessageChunk 格式
                    const kwargs = (data.data as any).kwargs;
                    if (kwargs.content && typeof kwargs.content === 'string') {
                      chunkContent = kwargs.content;
                    } else {
                      chunkContent = JSON.stringify(data.data);
                    }
                  } else {
                    chunkContent = JSON.stringify(data.data);
                  }
                } else {
                  chunkContent = String(data.data);
                }
                
                // 调试日志
                console.log('🔍 数据块类型:', typeof data.data, '内容:', data.data);
                console.log('🔍 提取的 chunkContent:', chunkContent);
                
                currentContent += chunkContent;
                
                // 直接更新现有消息的内容
                setMessages(prev => prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: currentContent }
                    : msg
                ));
              } else if (data.type === 'done') {
                currentSources = data.data?.sources || [];
                const newSessionId = data.data?.sessionId;

                if (!sessionId && newSessionId) {
                  setSessionId(newSessionId);
                }

                // 更新消息的sources
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, sources: currentSources }
                      : msg
                  )
                );
              } else if (data.type === 'error') {
                throw new Error(data.message || '流式处理失败');
              }
            } catch (err) {
              console.error('解析事件数据失败:', err);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送消息失败，请重试';
      setError(errorMessage);
      console.error('发送消息失败:', err);
      setStreamingMessageId(null);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, token, sessionId, loadSessions, useRAG]);

  // 清理 AbortController
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 终止当前对话
  const handleStopGeneration = useCallback(async () => {
    // 1. 中止客户端 HTTP 请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. 通知后端中止 LLM 请求
    if (requestId && token) {
      try {
        const response = await fetch(`${API_BASE}/ai-assistant/message/abort`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ requestId }),
        });

        const data = await response.json();
        if (data.success) {
          console.log('✅ 后端请求已中止');
        }
      } catch (error) {
        console.error('中止后端请求失败:', error);
      }
    }

    setIsTyping(false);
    setStreamingMessageId(null);
    setRequestId(null);
  }, [requestId, token]);

  // 重新发送最后一条用户消息
  const handleResendLastMessage = useCallback(() => {
    if (messages.length === 0 || isTyping) return;

    // 找到最后一条用户消息
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];
    
    // 移除该用户消息之后的所有消息（包括AI回复）
    const messagesBeforeResend = messages.slice(0, lastUserMessageIndex);
    setMessages(messagesBeforeResend);
    
    // 重新发送这条消息
    setInput(lastUserMessage.content);
    setTimeout(() => {
      handleSend();
    }, 0);
  }, [messages, isTyping, handleSend]);

  // 删除单条消息（用户或AI消息）
  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="assistant-container">
      {/* 头部 */}
      <div className="assistant-header">
        <div className="header-left">
          <h3>🤖 AI 智能助手</h3>
          <p>连接到你的知识库，提供智能问答和创意支持</p>
        </div>
        <div className="header-right">
          <button 
            className="header-button"
            onClick={createNewSession}
            title="新建会话"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          <button 
            className="header-button"
            onClick={() => setShowHistory(!showHistory)}
            title="历史会话"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 历史会话下拉菜单 */}
      {showHistory && (
        <div className="history-dropdown" ref={dropdownRef}>
          <div className="dropdown-header">
            <h4>历史会话</h4>
          </div>
          <div className="dropdown-content">
            {sessions.length > 0 ? (
              sessions.map(session => (
                <div 
                  key={session.id} 
                  className="session-item"
                  onClick={() => switchSession(session.id)}
                >
                  <div className="session-info">
                    <h5 className="session-title">{session.title}</h5>
                    <div className="session-meta">
                      <span className="session-time">
                        {formatDate(new Date(session.updatedAt))}
                      </span>
                      <span className="session-count">
                        {session.messageCount} 条消息
                      </span>
                    </div>
                  </div>
                  <div className="session-actions">
                    <button 
                      className="action-button"
                      onClick={(e) => deleteSession(session.id, e)}
                      title="删除会话"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-sessions">
                暂无历史会话
              </div>
            )}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="message-list">
        {messages.length === 0 && (
          <div className="initial-state">
            <div className="initial-content">
              <div className="avatar assistant-avatar">🤖</div>
              <div className="message-bubble assistant-message initial-bubble">
                <p>你好！👋 我是AI助手，很高兴为你服务！我可以帮你：</p>
                <p>• 解答问题和提供建议</p>
                <p>• 帮你整理思路和分析内容</p>
                <p>• 利用你的知识库提供更精准的回答</p>
                <p>有什么我可以帮你的吗？</p>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`message-wrapper ${msg.role === 'user' ? 'user-message' : ''}`}
          >
            <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content-wrapper">
              <div className={`message-bubble ${msg.role === 'user' ? 'user-message' : ''}`}>
                {msg.role === 'user' ? (
                  // 用户消息：普通文本显示
                  msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))
                ) : (
                  // AI助手消息：使用Markdown渲染器
                  <MarkdownRenderer 
                    content={msg.content} 
                    isStreaming={streamingMessageId === msg.id}
                  />
                )}
                {msg.sources && msg.sources.length > 0 && msg.role === 'assistant' && (
                  <div className="sources-container">
                    <p>📚 知识库来源</p>
                    <div className="sources-list">
                      {msg.sources.map((source, idx) => (
                        <span 
                          key={idx} 
                          className="source-tag"
                          title={`${source.title} (相似度: ${(source.score * 100).toFixed(1)}%)`}
                        >
                          {source.title} ({(source.score * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="message-actions">
                <span className={`timestamp ${msg.role === 'user' ? 'user-timestamp' : ''}`}>
                  {formatTime(msg.timestamp)}
                </span>
                {idx === messages.length - 1 && msg.role === 'user' && (
                  <button 
                    className="action-btn resend-btn"
                    onClick={handleResendLastMessage}
                    title="重新发送"
                    disabled={isTyping}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2-8.83" />
                    </svg>
                  </button>
                )}
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteMessage(msg.id)}
                  title="删除"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {error && <div className="error-message">❌ {error}</div>}
        
        <div ref={messagesEndRef} className="scroll-indicator" />
      </div>
      
      {/* 输入区域 */}
      <div className="input-area">
        {/* 知识库开关 */}
        <div className="rag-toggle">
          <button 
            className={`rag-button ${useRAG ? 'active' : ''}`}
            onClick={() => setUseRAG(!useRAG)}
            title={useRAG ? '知识库（开启）' : '知识库（关闭）'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="6" x2="15" y2="6" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="9" y1="14" x2="13" y2="14" />
            </svg>
            <span className="rag-label">{useRAG ? '知识库' : '普通模式'}</span>
          </button>
        </div>

        {/* 输入框和发送按钮 */}
        <div className="input-wrapper">
          <textarea 
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            disabled={isTyping || !token}
            className="textarea-input"
            rows={1}
          />
          {isTyping ? (
            <button 
              aria-label="停止生成"
              className="stop-button" 
              onClick={handleStopGeneration}
              title="停止生成"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          ) : (
            <button 
              aria-label="发送消息"
              className="send-button" 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping || !token}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
