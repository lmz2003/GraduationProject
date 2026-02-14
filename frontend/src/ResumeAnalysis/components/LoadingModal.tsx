import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInOut = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  animation: ${fadeInOut} 0.3s ease-in;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 40px 50px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  animation: ${fadeInOut} 0.4s ease-out;
  min-width: 300px;
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
`;

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: #64748b;
  text-align: center;
`;

const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
`;

const Dot = styled.span<{ active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.active ? '#4f46e5' : '#cbd5e1'};
  transition: all 0.3s ease;
`;

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
  maxProgress?: number;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title = '加载中',
  description = '正在处理您的简历...',
  showProgress = false,
  progress = 0,
  maxProgress = 5,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContent>
        <Spinner />
        <TextContainer>
          <Title>{title}</Title>
          <Description>{description}</Description>
          {showProgress && (
            <Progress>
              {Array.from({ length: maxProgress }).map((_, i) => (
                <Dot key={i} active={i < progress} />
              ))}
              <span>{progress}/{maxProgress}</span>
            </Progress>
          )}
        </TextContainer>
      </ModalContent>
    </Overlay>
  );
};

export default LoadingModal;
