import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AssistantContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 30;
  min-height: 0;
`;

const WelcomeBanner = styled.div`
  padding: 24px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  animation: ${slideUp} 0.5s ease-out;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);

  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 0;
    font-size: 13px;
    opacity: 0.95;
    line-height: 1.6;
    font-weight: 500;
  }
`;

const MessageList = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f8fafc;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
  }
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  animation: ${fadeIn} 0.3s ease-out;
  flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
`;

const Avatar = styled.div<{ $isUser: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
  color: white;
  box-shadow: 0 3px 12px ${props => props.$isUser 
    ? 'rgba(79, 70, 229, 0.3)' 
    : 'rgba(16, 185, 129, 0.3)'};
  transition: all 0.2s ease;
  animation: ${fadeIn} 0.3s ease-out;
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: calc(85% - 42px);
  padding: 14px 16px;
  border-radius: ${props => props.$isUser 
    ? '16px 4px 16px 16px' 
    : '4px 16px 16px 16px'};
  font-size: 14px;
  line-height: 1.7;
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
    : '#ffffff'};
  color: ${props => props.$isUser ? '#ffffff' : '#1e293b'};
  box-shadow: ${props => props.$isUser 
    ? '0 4px 16px rgba(79, 70, 229, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.06)'};
  border: ${props => props.$isUser ? 'none' : '1px solid #e2e8f0'};
  transition: all 0.2s ease;
  animation: ${fadeIn} 0.3s ease-out;
  word-break: break-word;

  p {
    margin: 0;
    
    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }

  a {
    color: ${props => props.$isUser ? '#a5b4fc' : '#3b82f6'};
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: ${props => props.$isUser ? '#c7d2fe' : '#2563eb'};
    }
  }

  &:hover {
    ${props => props.$isUser ? 'transform: translateX(-2px);' : 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);'}
  }
`;

const Timestamp = styled.span<{ $isUser: boolean }>`
  font-size: 11px;
  color: ${props => props.$isUser ? '#a5b4fc' : '#94a3b8'};
  margin-top: 4px;
  display: block;
`;

const SourcesContainer = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;

  p {
    margin: 0 0 6px 0;
    opacity: 0.9;
    font-weight: 600;
  }

  div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    span {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 16px 16px 16px 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  width: fit-content;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    animation: ${pulse} 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

const InputArea = styled.div`
  padding: 16px;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8fafc;
  font-family: inherit;

  &:focus {
    border-color: #4f46e5;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  &:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #94a3b8;
    transition: color 0.2s ease;
  }

  &:focus::placeholder {
    color: #cbd5e1;
  }
`;

const SendButton = styled.button<{ $disabled: boolean }>`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$disabled 
    ? '#e2e8f0' 
    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'};
  color: white;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$disabled ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)'};
  position: relative;

  &:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.94);
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
  }

  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }

  &:hover:not(:disabled) svg {
    transform: translateX(2px);
  }
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  margin: 8px 0;
  animation: ${fadeIn} 0.3s ease-out;
`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; score: number }>;
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AIAssistant: React.FC = () => {
  const token = localStorage.getItem('token');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！👋 我是AI助手，很高兴为你服务！我可以帮你：\n\n• 解答问题和提供建议\n• 帮你整理思路和分析内容\n• 利用你的知识库提供更精准的回答\n\n有什么我可以帮你的吗？',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping || !token) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai-assistant/message`, {
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
        setMessages(prev => [...prev, aiMessage]);
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
  }, [input, isTyping, token, sessionId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AssistantContainer>
      <WelcomeBanner>
        <h3>🤖 AI 智能助手</h3>
        <p>连接到你的知识库，提供智能问答和创意支持</p>
      </WelcomeBanner>
      
      <MessageList>
        {messages.map(msg => (
          <MessageWrapper key={msg.id} $isUser={msg.role === 'user'}>
            <Avatar $isUser={msg.role === 'user'}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </Avatar>
            <div>
              <MessageBubble $isUser={msg.role === 'user'}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {msg.sources && msg.sources.length > 0 && msg.role === 'assistant' && (
                  <SourcesContainer>
                    <p>📚 知识库来源</p>
                    <div>
                      {msg.sources.map((source, idx) => (
                        <span key={idx} title={`${source.title} (相似度: ${(source.score * 100).toFixed(1)}%)`}>
                          {source.title} ({(source.score * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </SourcesContainer>
                )}
              </MessageBubble>
              <Timestamp $isUser={msg.role === 'user'}>
                {formatTime(msg.timestamp)}
              </Timestamp>
            </div>
          </MessageWrapper>
        ))}
        
        {isTyping && (
          <MessageWrapper $isUser={false}>
            <Avatar $isUser={false}>🤖</Avatar>
            <TypingIndicator>
              <span></span>
              <span></span>
              <span></span>
            </TypingIndicator>
          </MessageWrapper>
        )}
        
        {error && <ErrorMessage>❌ {error}</ErrorMessage>}
        
        <div ref={messagesEndRef} />
      </MessageList>
      
      <InputArea>
        <InputWrapper>
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            disabled={isTyping || !token}
          />
        </InputWrapper>
        <SendButton 
          onClick={handleSend} 
          disabled={!input.trim() || isTyping || !token}
          $disabled={!input.trim() || isTyping || !token}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </SendButton>
      </InputArea>
    </AssistantContainer>
  );
};

export default AIAssistant;
