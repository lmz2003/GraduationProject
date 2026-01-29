import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AIAssistant.scss';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // 发送消息
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
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/ai-assistant/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input.trim(),
          sessionId: sessionId || undefined,
          useRAG: true,
          topK: 5,
          threshold: 0.5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '消息处理失败');
      }

      if (data.success) {
        // 设置会话ID
        if (!sessionId) {
          setSessionId(data.data.sessionId);
        }

        // 创建AI回复消息
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(data.data.timestamp),
          sources: data.data.sources?.map((s: any) => ({
            title: s.title,
            score: s.score,
          })) || [],
        };
        
        // 更新消息列表，添加AI回复
        setMessages(prev => [...prev, aiMessage]);
        
        // 更新会话列表
        loadSessions();
      } else {
        throw new Error(data.message || '消息处理失败');
      }
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : '发送消息失败，请重试';
       setError(errorMessage);
       console.error('发送消息失败:', err);
     } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, token, sessionId, loadSessions]);

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
        
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`message-wrapper ${msg.role === 'user' ? 'user-message' : ''}`}
          >
            <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div>
              <div className={`message-bubble ${msg.role === 'user' ? 'user-message' : ''}`}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
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
              <span className={`timestamp ${msg.role === 'user' ? 'user-timestamp' : ''}`}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message-wrapper">
            <div className="avatar assistant-avatar">🤖</div>
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        
        {error && <div className="error-message">❌ {error}</div>}
        
        <div ref={messagesEndRef} className="scroll-indicator" />
      </div>
      
      {/* 输入区域 */}
      <div className="input-area">
        <div className="input-wrapper">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            disabled={isTyping || !token}
          />
        </div>
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
      </div>
    </div>
  );
};

export default AIAssistant;
