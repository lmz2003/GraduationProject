import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAIAssistant } from '../context/AIAssistantContext';

// Styled components for the AI Assistant
const AssistantContainer = styled.div<{ $isOpen: boolean }>`
  width: ${props => props.$isOpen ? '350px' : '0'};
  height: 100%;
  background-color: #ffffff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 30;

  @media (max-width: 1200px) {
    width: ${props => props.$isOpen ? '300px' : '0'};
  }

  @media (max-width: 900px) {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.$isOpen ? '320px' : '0'};
    box-shadow: ${props => props.$isOpen ? '-4px 0 15px rgba(0, 0, 0, 0.1)' : 'none'};
  }

  @media (max-width: 480px) {
    width: ${props => props.$isOpen ? '100%' : '0'};
  }
`;

const Header = styled.div`
  height: 64px;
  padding: 0 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8fafc;
  flex-shrink: 0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background-color: #e2e8f0;
    color: #0f172a;
  }
`;

const MessageList = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f8fafc;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.$isUser ? '#4f46e5' : '#ffffff'};
  color: ${props => props.$isUser ? '#ffffff' : '#0f172a'};
  box-shadow: ${props => props.$isUser ? '0 2px 4px rgba(79, 70, 229, 0.2)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'};
  border: ${props => props.$isUser ? 'none' : '1px solid #e2e8f0'};
  border-bottom-right-radius: ${props => props.$isUser ? '2px' : '12px'};
  border-bottom-left-radius: ${props => props.$isUser ? '12px' : '2px'};
`;

const InputArea = styled.div`
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #ffffff;
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const SendButton = styled.button`
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4338ca;
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  
  @media (max-width: 1024px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 25;
    backdrop-filter: blur(2px);
  }
`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { isOpen, toggleOpen } = useAIAssistant();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '你好！我是你的AI助手。我可以帮你分析简历、准备面试，或者回答任何问题。',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: '我收到了你的消息：' + input + '。作为一个演示版本，我目前只能这样回复。在实际项目中，这里会连接到后端API。',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={toggleOpen} />
      <AssistantContainer $isOpen={isOpen}>
        <Header>
          <Title>
            <span>🤖</span> AI 助手
          </Title>
          <CloseButton onClick={toggleOpen} title="关闭">
            ✕
          </CloseButton>
        </Header>
        
        <MessageList>
          {messages.map(msg => (
            <MessageBubble key={msg.id} $isUser={msg.isUser}>
              {msg.text}
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessageList>
        
        <InputArea>
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题..."
          />
          <SendButton onClick={handleSend} disabled={!input.trim()}>
            发送
          </SendButton>
        </InputArea>
      </AssistantContainer>
    </>
  );
};

export default AIAssistant;
