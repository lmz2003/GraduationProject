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

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

interface PDFViewerProps {
  filePath: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ filePath }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟 PDF 加载
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [filePath]);

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <p>📄 PDF 文件预览不可用</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            {error}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px' }}>
            你可以下载文件后用本地应用打开
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

  // 使用 Google Docs 的 PDF 查看器或提供下载链接
  const pdfUrl = filePath.startsWith('http')
    ? filePath
    : `${window.location.origin}/${filePath}`;

  return (
    <Container>
      <Iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
        title="PDF Viewer"
        onError={() => setError('PDF viewer 不可用，请尝试下载文件')}
      />
    </Container>
  );
};

export default PDFViewer;
