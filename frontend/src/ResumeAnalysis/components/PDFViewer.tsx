import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  text-align: center;
  padding: 20px;
  max-width: 400px;
`;

const LoadingMessage = styled.div`
  color: #64748b;
  text-align: center;
`;

const Spinner = styled.div`
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

const PDFEmbed = styled.embed`
  width: 100%;
  height: 100%;
  border: none;
`;

const PDFObject = styled.object`
  width: 100%;
  height: 100%;
  border: none;
`;

const FallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
`;

const FallbackText = styled.p`
  color: #64748b;
  text-align: center;
  margin: 0;
  max-width: 300px;
`;

const DownloadLink = styled.a`
  padding: 10px 16px;
  background: #4f46e5;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

interface PDFViewerProps {
  filePath: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ filePath }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    // 构建完整的 PDF URL
    let url = filePath;
    
    // 如果是相对路径，添加 API 基础 URL
    if (!filePath.startsWith('http')) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      url = `${apiBaseUrl}/${filePath}`;
    }
    
    setPdfUrl(url);
    setLoading(false);
  }, [filePath]);

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <p>📄 PDF 文件预览不可用</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            {error}
          </p>
        </ErrorMessage>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Spinner />
        <LoadingMessage>加载 PDF 中...</LoadingMessage>
      </Container>
    );
  }

  // 尝试使用 embed 标签（推荐）
  return (
    <Container>
      <PDFEmbed
        src={pdfUrl}
        type="application/pdf"
        onError={() => setError('无法加载 PDF 文件')}
      />
      {error && (
        <FallbackContainer>
          <FallbackText>PDF 预览不可用</FallbackText>
          <DownloadLink href={pdfUrl} download target="_blank">
            📥 下载文件
          </DownloadLink>
        </FallbackContainer>
      )}
    </Container>
  );
};

export default PDFViewer;
