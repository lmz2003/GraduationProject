import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useToastModal } from '../components/ui/toast-modal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  height: 100%;
  overflow-y: auto;
`;

const Header = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 12px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: ${props => (props.$active ? '#4f46e5' : '#64748b')};
  font-size: 1rem;
  font-weight: ${props => (props.$active ? '600' : '500')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4f46e5;
  }

  ${props => props.$active && `
    border-bottom-color: #4f46e5;
  `}
`;

const Content = styled.div`
  background: white;
  border-radius: 8px;
  padding: 30px;
`;

// File Upload Style
const UploadZone = styled.div<{ $isDragActive?: boolean }>`
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => (props.$isDragActive ? '#ede9fe' : '#f8fafc')};
  border-color: ${props => (props.$isDragActive ? '#4f46e5' : '#cbd5e1')};

  &:hover {
    border-color: #4f46e5;
    background: #f5f3ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 12px;
`;

const UploadText = styled.p`
  color: #0f172a;
  font-size: 1rem;
  font-weight: 500;
  margin: 8px 0;
`;

const UploadSubtext = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
`;

const HiddenInput = styled.input`
  display: none;
`;

// Text Input Style
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const Label = styled.label`
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  min-height: 200px;
  font-family: 'Inter', sans-serif;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props =>
    props.$variant === 'secondary'
      ? `
    background: #e2e8f0;
    color: #0f172a;

    &:hover {
      background: #cbd5e1;
    }
  `
      : `
    background: #4f46e5;
    color: white;

    &:hover {
      background: #4338ca;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  margin-top: 20px;
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 8px;
`;

const FileName = styled.span`
  color: #0f172a;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;

  &:hover {
    background: #fecaca;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 20px;
`;

const Progress = styled.div<{ $progress: number }>`
  height: 100%;
  background: #4f46e5;
  width: ${props => props.$progress}%;
  transition: width 0.2s;
`;

const ResumeUpload: React.FC = () => {
  const navigate = useNavigate();
  const { error, success } = useToastModal();
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      const supportedTypes = ['.pdf', '.docx', '.doc', '.txt'];
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

      if (supportedTypes.includes(fileExt)) {
        setFile(selectedFile);
        setTitle(selectedFile.name.replace(/\.[^.]+$/, ''));
      } else {
        error(
          `仅支持 ${supportedTypes.join(', ')} 格式`,
          '文件类型不支持'
        );
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setTitle(files[0].name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearForm = () => {
    setTitle('');
    setContent('');
    setFile(null);
    setUploadType('file');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      error('请输入简历标题', '标题缺失');
      return;
    }

    if (uploadType === 'file' && !file) {
      error('请选择要上传的文件', '文件缺失');
      return;
    }

    if (uploadType === 'text' && !content.trim()) {
      error('请输入简历内容', '内容缺失');
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      const formData = new FormData();
      formData.append('title', title);

      if (uploadType === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('content', content);
      }

      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + Math.random() * 30 : prev));
      }, 500);

      const response = await fetch(`${apiBaseUrl}/resume-analysis/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      success('简历已上传，正在分析中...', '上传成功');
      clearForm();

      setTimeout(() => {
        navigate('/dashboard/resume');
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      error(errorMsg, '上传失败');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Container>
      <Header>📤 上传简历</Header>

      <TabContainer>
        <Tab
          $active={uploadType === 'file'}
          onClick={() => setUploadType('file')}
        >
          📁 上传文件
        </Tab>
        <Tab
          $active={uploadType === 'text'}
          onClick={() => setUploadType('text')}
        >
          ✏️ 粘贴内容
        </Tab>
      </TabContainer>

      <Content>
        <FormGroup>
          <Label>简历标题</Label>
          <Input
            placeholder="例如：张三_2024年简历"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </FormGroup>

        {uploadType === 'file' ? (
          <>
            <UploadZone
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon>📄</UploadIcon>
              <UploadText>拖拽简历文件到此处</UploadText>
              <UploadSubtext>或点击选择文件</UploadSubtext>
            </UploadZone>

            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              disabled={loading}
            />

            {file && (
              <FileList>
                <FileItem>
                  <FileName>📋 {file.name}</FileName>
                  <RemoveButton onClick={handleRemoveFile} disabled={loading}>
                    移除
                  </RemoveButton>
                </FileItem>
              </FileList>
            )}
          </>
        ) : (
          <FormGroup>
            <Label>简历内容</Label>
            <Textarea
              placeholder="粘贴你的简历内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
          </FormGroup>
        )}

        {progress > 0 && (
          <ProgressBar>
            <Progress $progress={progress} />
          </ProgressBar>
        )}

        <ButtonGroup>
          <Button
            $variant="secondary"
            onClick={() => navigate('/dashboard/resume')}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? '上传中...' : '上传'}
          </Button>
        </ButtonGroup>
      </Content>
    </Container>
  );
};

export default ResumeUpload;
