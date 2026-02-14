import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useToastModal } from '../components/ui/toast-modal';
import PDFViewer from './components/PDFViewer';
import AnalysisPanel from './components/AnalysisPanel';
import LoadingModal from './components/LoadingModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

const BackButton = styled.button`
  padding: 8px 12px;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
  }
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1px;
  background: #e2e8f0;
`;

const LeftPanel = styled.div`
  flex: 1;
  overflow: auto;
  background: white;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  overflow: auto;
  background: white;
`;

const PDFContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
`;


interface Resume {
  id: string;
  title: string;
  content: string;
  fileType: string;
  fileUrl?: string;
  parsedData?: any;
  createdAt: string;
}

interface Analysis {
  id: string;
  overallScore: number;
  completenessScore: number;
  keywordScore: number;
  formatScore: number;
  experienceScore: number;
  skillsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Record<string, any>;
  keywordAnalysis: Record<string, number>;
  structureAnalysis: Record<string, any>;
  contentAnalysis: Record<string, any>;
  personalInfoSuggestions?: Record<string, any>;
  experienceSuggestions?: Record<string, any>[];
  skillsSuggestions?: Record<string, any>;
}

const ResumeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToastModal();

  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      // 并行获取简历和分析
      const [resumeRes, analysisRes] = await Promise.all([
        fetch(`${apiBaseUrl}/resume-analysis/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/resume-analysis/${id}/analysis`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false }) as any),
      ]);

      if (!resumeRes.ok) throw new Error('Failed to fetch resume');

      const resumeData = await resumeRes.json();
      setResume(resumeData.data);

      // 如果分析不存在，等待后重试
      if (analysisRes.ok && 'json' in analysisRes) {
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData.data);
      } else if (retryCount < 5) {
        // 分析可能还在处理，5秒后重试
        setTimeout(() => setRetryCount(prev => prev + 1), 5000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      error(errorMsg, '加载失败');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 重新获取分析结果
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 5 && !analysis) {
      const timer = setTimeout(() => {
        fetchAnalysisOnly();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  const fetchAnalysisOnly = async () => {
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiBaseUrl}/resume-analysis/${id}/analysis`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const analysisData = await response.json();
        setAnalysis(analysisData.data);
      } else if (retryCount < 5) {
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Container>
          <Header>
            <BackButton onClick={() => navigate('/dashboard/resume')}>← 返回</BackButton>
            <Title>简历分析</Title>
            <div />
          </Header>
          <Content>
            <LoadingContainer>
              <p>加载中...</p>
            </LoadingContainer>
          </Content>
        </Container>
        <LoadingModal
          isOpen={loading}
          title="📄 加载简历"
          description="正在获取简历信息..."
        />
      </>
    );
  }

  if (!resume) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate('/dashboard/resume')}>← 返回</BackButton>
          <Title>简历分析</Title>
          <div />
        </Header>
        <Content>
          <LoadingContainer>
            <p>简历不存在</p>
          </LoadingContainer>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/dashboard/resume')}>← 返回</BackButton>
        <Title>{resume.title}</Title>
        <div />
      </Header>

      <Content>
        <LeftPanel>
          <PDFContainer>
            {resume.fileType === 'pdf' ? (
              <PDFViewer resumeId={resume.id} />
            ) : (
              <div style={{ padding: '20px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflow: 'auto' }}>
                {resume.content}
              </div>
            )}
          </PDFContainer>
        </LeftPanel>

        <RightPanel>
          {!analysis ? (
            <LoadingContainer>
              <p>等待分析完成...</p>
            </LoadingContainer>
          ) : (
            <AnalysisPanel analysis={analysis} parsedData={resume.parsedData} />
          )}
        </RightPanel>

        {/* 分析加载弹窗 */}
        <LoadingModal
          isOpen={!analysis}
          title="✨ AI 分析中"
          description="正在使用 AI 为您的简历进行深度分析..."
          showProgress={true}
          progress={retryCount}
          maxProgress={5}
        />
      </Content>
    </Container>
  );
};

export default ResumeDetail;
