import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

export const Title = styled.h1`
  font-size: 1.3rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => {
    switch (props.$variant) {
      case 'secondary':
        return `
          background: #e2e8f0;
          color: #0f172a;
          &:hover {
            background: #cbd5e1;
          }
        `;
      case 'danger':
        return `
          background: #fee2e2;
          color: #dc2626;
          &:hover {
            background: #fecaca;
          }
        `;
      default:
        return `
          background: #4f46e5;
          color: white;
          &:hover {
            background: #4338ca;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

export const Section = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Alert = styled.div<{ $type?: 'info' | 'warning' | 'error' | 'success' }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  background-color: ${props => {
    switch (props.$type) {
      case 'error':
        return '#fee2e2';
      case 'warning':
        return '#fef3c7';
      case 'success':
        return '#dcfce7';
      default:
        return '#e0e7ff';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'error':
        return '#991b1b';
      case 'warning':
        return '#78350f';
      case 'success':
        return '#15803d';
      default:
        return '#3730a3';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'error':
        return '#dc2626';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#22c55e';
      default:
        return '#4f46e5';
    }
  }};
`;

export const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #64748b;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
