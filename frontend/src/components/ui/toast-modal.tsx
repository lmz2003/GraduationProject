import React, { createContext, useContext, useState, useCallback } from 'react';
import styled from 'styled-components';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// 弹窗类型定义
export type ToastModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface ToastModalOptions {
  type: ToastModalType;
  title?: string;
  message: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  duration?: number; // 仅用于 info/success/warning/error，毫秒
}

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);
  padding: 24px;
  max-width: 400px;
  width: 90%;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const IconWrapper = styled.div<{ type: ToastModalType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;

  color: ${(props) => {
    switch (props.type) {
      case 'success':
        return '#16a34a';
      case 'error':
        return '#dc2626';
      case 'warning':
        return '#ea580c';
      case 'info':
      case 'confirm':
        return '#2563eb';
      default:
        return '#64748b';
    }
  }};

  background: ${(props) => {
    switch (props.type) {
      case 'success':
        return '#dcfce7';
      case 'error':
        return '#fee2e2';
      case 'warning':
        return '#fed7aa';
      case 'info':
      case 'confirm':
        return '#dbeafe';
      default:
        return '#f1f5f9';
    }
  }};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
`;

const Message = styled.p`
  margin: 12px 0 0 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  background: ${(props) => (props.variant === 'secondary' ? '#e2e8f0' : '#2563eb')};
  color: ${(props) => (props.variant === 'secondary' ? '#0f172a' : 'white')};

  &:hover {
    background: ${(props) => (props.variant === 'secondary' ? '#cbd5e1' : '#1d4ed8')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #64748b;
  }
`;

// Context 和 Provider
interface ToastModalContextType {
  showModal: (options: ToastModalOptions) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  success: (message: string, title?: string) => Promise<void>;
  error: (message: string, title?: string) => Promise<void>;
  warning: (message: string, title?: string) => Promise<void>;
  info: (message: string, title?: string) => Promise<void>;
}

const ToastModalContext = createContext<ToastModalContextType | undefined>(undefined);

interface ModalState {
  isOpen: boolean;
  options?: ToastModalOptions;
  resolve?: (value: boolean) => void;
}

export const ToastModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });
  const [isLoading, setIsLoading] = useState(false);

  const showModal = useCallback(
    (options: ToastModalOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          options,
          resolve,
        });

        // 如果不是 confirm 类型，自动关闭
        if (options.type !== 'confirm') {
          const duration = options.duration || 3000;
          setTimeout(() => {
            resolve(true);
            setModalState({ isOpen: false });
          }, duration);
        }
      });
    },
    []
  );

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (modalState.options?.onConfirm) {
        await modalState.options.onConfirm();
      }
      modalState.resolve?.(true);
    } finally {
      setIsLoading(false);
      setModalState({ isOpen: false });
    }
  };

  const handleCancel = () => {
    modalState.options?.onCancel?.();
    modalState.resolve?.(false);
    setModalState({ isOpen: false });
  };

  const handleClose = () => {
    if (modalState.options?.type === 'confirm') {
      handleCancel();
    } else {
      modalState.resolve?.(true);
      setModalState({ isOpen: false });
    }
  };

  const contextValue: ToastModalContextType = {
    showModal,
    alert: (message, title) =>
      showModal({
        type: 'error',
        title: title || '提示',
        message,
        duration: 3000,
      }).then(() => {}),
    confirm: (message, title) =>
      showModal({
        type: 'confirm',
        title: title || '确认',
        message,
        confirmText: '确定',
        cancelText: '取消',
      }),
    success: (message, title) =>
      showModal({
        type: 'success',
        title: title || '成功',
        message,
        duration: 3000,
      }).then(() => {}),
    error: (message, title) =>
      showModal({
        type: 'error',
        title: title || '错误',
        message,
        duration: 3000,
      }).then(() => {}),
    warning: (message, title) =>
      showModal({
        type: 'warning',
        title: title || '警告',
        message,
        duration: 3000,
      }).then(() => {}),
    info: (message, title) =>
      showModal({
        type: 'info',
        title: title || '提示',
        message,
        duration: 3000,
      }).then(() => {}),
  };

  return (
    <ToastModalContext.Provider value={contextValue}>
      {children}
      {modalState.isOpen && modalState.options && (
        <Overlay onClick={handleClose}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleClose}>
              <X size={20} />
            </CloseButton>

            <Header>
              <IconWrapper type={modalState.options.type}>
                {modalState.options.type === 'success' && <CheckCircle size={18} />}
                {modalState.options.type === 'error' && <AlertCircle size={18} />}
                {modalState.options.type === 'warning' && <AlertTriangle size={18} />}
                {(modalState.options.type === 'info' || modalState.options.type === 'confirm') && (
                  <Info size={18} />
                )}
              </IconWrapper>
              {modalState.options.title && <Title>{modalState.options.title}</Title>}
            </Header>

            <Message>{modalState.options.message}</Message>

            {modalState.options.type === 'confirm' && (
              <ButtonGroup>
                <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
                  {modalState.options.cancelText || '取消'}
                </Button>
                <Button onClick={handleConfirm} disabled={isLoading}>
                  {isLoading ? '处理中...' : modalState.options.confirmText || '确定'}
                </Button>
              </ButtonGroup>
            )}
          </ModalContainer>
        </Overlay>
      )}
    </ToastModalContext.Provider>
  );
};

// Hook
export const useToastModal = (): ToastModalContextType => {
  const context = useContext(ToastModalContext);
  if (!context) {
    throw new Error('useToastModal must be used within a ToastModalProvider');
  }
  return context;
};
