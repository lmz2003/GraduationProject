import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

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
  padding: 20px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  animation: ${fadeIn} 0.5s ease-out;

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 0;
    font-size: 13px;
    opacity: 0.9;
    line-height: 1.5;
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: calc(85% - 42px);
  padding: 12px 16px;
  border-radius: ${props => props.$isUser 
    ? '16px 4px 16px 16px' 
    : '4px 16px 16px 16px'};
  font-size: 14px;
  line-height: 1.6;
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
    : '#ffffff'};
  color: ${props => props.$isUser ? '#ffffff' : '#1e293b'};
  box-shadow: ${props => props.$isUser 
    ? '0 4px 12px rgba(79, 70, 229, 0.3)' 
    : '0 1px 3px rgba(0, 0, 0, 0.08)'};
  border: ${props => props.$isUser ? 'none' : '1px solid #e2e8f0'};

  p {
    margin: 0;
  }

  a {
    color: ${props => props.$isUser ? '#a5b4fc' : '#3b82f6'};
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: ${props => props.$isUser ? '#c7d2fe' : '#2563eb'};
    }
  }
`;

const Timestamp = styled.span<{ $isUser: boolean }>`
  font-size: 11px;
  color: ${props => props.$isUser ? '#a5b4fc' : '#94a3b8'};
  margin-top: 4px;
  display: block;
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
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
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
  transition: all 0.2s;
  background: #f8fafc;

  &:focus {
    border-color: #4f46e5;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SendButton = styled.button<{ $disabled: boolean }>`
  width: 44px;
  height: 44px;
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
  transition: all 0.2s;
  box-shadow: ${props => props.$disabled ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)'};

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AIAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '你好！👋 我是AI助手，很高兴为你服务！我可以帮你：\n\n• 解答问题和提供建议\n• 帮你整理思路和分析内容\n• 提供创意灵感和写作帮助\n\n有什么我可以帮你的吗？',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        '我理解你的问题了，让我思考一下... 🤔',
        '这是个很有趣的话题！让我来帮你分析一下... 💡',
        '好的，我收到了！让我组织一下思路... ✨',
        '关于这个问题，我可以给你一些建议... 📝'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse + '\n\n（这是一个演示版本，在实际项目中这里会连接到后端AI API）',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

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
        <p>随时为你提供智能问答和创意支持</p>
      </WelcomeBanner>
      
      <MessageList>
        {messages.map(msg => (
          <MessageWrapper key={msg.id} $isUser={msg.isUser}>
            <Avatar $isUser={msg.isUser}>
              {msg.isUser ? '👤' : '🤖'}
            </Avatar>
            <div>
              <MessageBubble $isUser={msg.isUser}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </MessageBubble>
              <Timestamp $isUser={msg.isUser}>
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
        
        <div ref={messagesEndRef} />
      </MessageList>
      
      <InputArea>
        <InputWrapper>
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            disabled={isTyping}
          />
        </InputWrapper>
        <SendButton 
          onClick={handleSend} 
          disabled={!input.trim() || isTyping}
          $disabled={!input.trim() || isTyping}
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
