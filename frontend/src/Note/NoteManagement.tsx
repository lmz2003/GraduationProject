import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import MarkdownEditor from './MarkdownEditor';
import PdfExportModal from '../components/PdfExportModal';

// Styled components
const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.variant === 'primary' && `
    background-color: #667eea;
    color: white;
    
    &:hover {
      background-color: #5568d3;
    }
  `}
  
  ${props => props.variant === 'secondary' && `
    background-color: #f0f0f0;
    color: #333;
    
    &:hover {
      background-color: #e0e0e0;
    }
  `}
  
  ${props => props.variant === 'danger' && `
    background-color: #ef4444;
    color: white;
    
    &:hover {
      background-color: #dc2626;
    }
  `}
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  padding: 0 1rem;
  text-align: center;
`;

// NoteManagement component
const NoteManagement: React.FC = () => {
  // State for markdown content
  const [markdown, setMarkdown] = useState<string>('');
  
  // State for PDF export modal
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);
  
  // Reference for preview area (used for PDF export)
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle markdown content change
  const handleContentChange = (content: string) => {
    setMarkdown(content);
  };

  // Clear content function
  const handleClear = () => {
    if (window.confirm('确定要清除所有内容吗？')) {
      setMarkdown('');
    }
  };

  // Export markdown function
  const handleExportMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-export-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle PDF export settings
  const handlePdfSettings = () => {
    setShowPdfSettings(true);
  };

  return (
    <ManagementContainer>
      {/* Action buttons */}
      <ActionButtons>
        <Button variant="danger" onClick={handleClear}>
          🗑️ 清除内容
        </Button>
        <Button variant="secondary" onClick={handleExportMd}>
          📥 导出 MD
        </Button>
        <Button variant="primary" onClick={handlePdfSettings}>
          📄 PDF 导出设置
        </Button>
      </ActionButtons>

      {/* Markdown Editor */}
      <MarkdownEditor 
        onContentChange={handleContentChange}
      />

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={showPdfSettings}
        onClose={() => setShowPdfSettings(false)}
        previewRef={previewRef}
        markdown={markdown}
      />

      {/* Info text */}
      <InfoText>
        💡 提示：您的内容会自动保存到浏览器本地存储中
      </InfoText>
    </ManagementContainer>
  );
};

export default NoteManagement;