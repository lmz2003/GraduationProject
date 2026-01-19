import React, { useState } from 'react';
import styled from 'styled-components';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// PDF配置接口
export interface PdfConfig {
  title: string;
  pageSize: 'a4' | 'letter' | 'legal' | 'tabloid';
  orientation: 'portrait' | 'landscape';
  includeHeader: boolean;
  includeFooter: boolean;
}

// Props interface
export interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
  markdown?: string;
  htmlContent?: string;
}

// Styled components
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const CheckboxGroup = styled(FormGroup)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ModalActions = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button<{ isPrimary?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.isPrimary ? '#667eea' : '#f0f0f0'};
  color: ${props => props.isPrimary ? 'white' : '#333'};
  
  &:hover {
    background-color: ${props => props.isPrimary ? '#5568d3' : '#e0e0e0'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Spinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// PdfExportModal component
const PdfExportModal: React.FC<PdfExportModalProps> = ({ 
  isOpen, 
  onClose, 
  previewRef, 
  markdown,
  htmlContent
}) => {
  // State for PDF configuration
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>({
    title: 'Markdown 导出文档',
    pageSize: 'a4',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Update PDF configuration
  const updatePdfConfig = (key: keyof PdfConfig, value: string | boolean) => {
    setPdfConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // PDF export function
  const handleExportPdf = async () => {
    try {
      setIsLoading(true);
      
      // Check preview area or markdown content
      if (!previewRef.current && !markdown && !htmlContent) {
        throw new Error('No content to export');
      }

      // Create PDF document
      const doc = new jsPDF(pdfConfig.orientation, 'mm', pdfConfig.pageSize);

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      let canvas: HTMLCanvasElement;
      
      if (previewRef.current) {
        // Use preview area if available (better styling)
        canvas = await html2canvas(previewRef.current, {
          scale: 2, // Improve quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
      } else if (htmlContent) {
        // Use HTML content if available
        const tempElement = document.createElement('div');
        tempElement.innerHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1>${pdfConfig.title}</h1>
            <div>${htmlContent}</div>
          </div>
        `;
        document.body.appendChild(tempElement);
        
        canvas = await html2canvas(tempElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        document.body.removeChild(tempElement);
      } else {
        // Fallback: create temporary element from markdown
        const tempElement = document.createElement('div');
        tempElement.innerHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1>${pdfConfig.title}</h1>
            <div>${markdown}</div>
          </div>
        `;
        document.body.appendChild(tempElement);
        
        canvas = await html2canvas(tempElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        document.body.removeChild(tempElement);
      }
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate image dimensions to fit page
      const imgWidth = pageWidth - 20; // 10mm margins on each side
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Calculate starting Y position
      let startY = 10;
      
      // Add header if enabled
      if (pdfConfig.includeHeader && pdfConfig.title) {
        doc.setFontSize(18);
        doc.text(pdfConfig.title, pageWidth / 2, startY, { align: 'center' });
        startY += 20;
      }
      
      // Check if we need to handle pagination
      let heightLeft = imgHeight;
      let position = startY;
      
      // Add image to PDF
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position - 10;
      
      // Handle multiple pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }
      
      // Add footer if enabled
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        if (pdfConfig.includeFooter) {
          const footerText = `${pdfConfig.title} - Page ${i} of ${pages} - Generated on ${new Date().toLocaleString()}`;
          doc.setFontSize(10);
          doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      }
      
      // Save PDF
      const fileName = `markdown-pdf-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>PDF 导出设置</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <FormGroup>
            <Label htmlFor="pdf-title">文档标题:</Label>
            <Input
              id="pdf-title"
              type="text"
              value={pdfConfig.title}
              onChange={(e) => updatePdfConfig('title', e.target.value)}
              placeholder="输入文档标题"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="page-size">页面大小:</Label>
            <Select
              id="page-size"
              value={pdfConfig.pageSize}
              onChange={(e) => updatePdfConfig('pageSize', e.target.value as PdfConfig['pageSize'])}
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
              <option value="tabloid">Tabloid</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="orientation">页面方向:</Label>
            <Select
              id="orientation"
              value={pdfConfig.orientation}
              onChange={(e) => updatePdfConfig('orientation', e.target.value as PdfConfig['orientation'])}
            >
              <option value="portrait">纵向</option>
              <option value="landscape">横向</option>
            </Select>
          </FormGroup>
          
          <CheckboxGroup>
            <Checkbox
              id="include-header"
              type="checkbox"
              checked={pdfConfig.includeHeader}
              onChange={(e) => updatePdfConfig('includeHeader', e.target.checked)}
            />
            <Label htmlFor="include-header" style={{ marginBottom: 0 }}>包含页眉</Label>
          </CheckboxGroup>
          
          <CheckboxGroup>
            <Checkbox
              id="include-footer"
              type="checkbox"
              checked={pdfConfig.includeFooter}
              onChange={(e) => updatePdfConfig('includeFooter', e.target.checked)}
            />
            <Label htmlFor="include-footer" style={{ marginBottom: 0 }}>包含页脚（页码和时间）</Label>
          </CheckboxGroup>
        </ModalBody>
        
        <ModalActions>
          <Button onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button 
            isPrimary 
            onClick={handleExportPdf} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner />
                导出中...
              </>
            ) : (
              '导出 PDF'
            )}
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PdfExportModal;