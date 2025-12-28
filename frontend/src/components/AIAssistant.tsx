import React, { useState } from 'react';
import styled from 'styled-components';
import { useAIAssistant } from '../context/AIAssistantContext';

const AssistantContainer = styled.div<{ $isOpen: boolean }>`
  width: ${props => props.$isOpen ? '350px' : '0'};
  height: 100%;
  background-color: #ffffff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
`;

const Header = styled.div`
  height: 64px;
  padding: 0 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8fafc;
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
  box-shadow: ${props => props.$isUser ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'};
  border: ${props => props.$isUser ? 'none' : '1px solid #e2e8f0'};
`;

const InputArea = styled.div`
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #ffffff;
  display: flex;
  gap: 0.5rem;
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
    background-color: #cbd5e1;
    cursor: not-allowed;
  }
`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const AIAssistant: React.FC = () => {
  const { isOpen, toggleOpen } = useAIAssistant();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '你好！我是你的AI面试助手。有什么我可以帮你的吗？', isUser: false }
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: '我收到了你的消息。作为一个演示助手，我目前还不能真正处理复杂的请求，但在未来我会变得更聪明！',
        isUser: false
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
    <AssistantContainer $isOpen={isOpen}>
      <Header>
        <Title>
          <span>🤖</span> AI 助手
        </Title>
        <CloseButton onClick={toggleOpen} title="收起助手">
          ✕
        </CloseButton>
      </Header>
      
      <MessageList>
        {messages.map(msg => (
          <MessageBubble key={msg.id} $isUser={msg.isUser}>
            {msg.text}
          </MessageBubble>
        ))}
      </MessageList>
      
      <InputArea>
        <Input 
          placeholder="输入你的问题..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <SendButton onClick={handleSend} disabled={!inputValue.trim()}>
          发送
        </SendButton>
      </InputArea>
    </AssistantContainer>
  );
};

export default AIAssistant;
