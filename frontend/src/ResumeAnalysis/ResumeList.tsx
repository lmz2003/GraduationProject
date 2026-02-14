import React, { useState, useEffect } from 'react';
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

const UploadButton = styled.button`
  padding: 10px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const ResumeCard = styled.div<{ $isLoading?: boolean }>`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #4f46e5;
  pointer-events: ${props => (props.$isLoading ? 'none' : 'auto')};
  opacity: ${props => (props.$isLoading ? 0.6 : 1)};

  &:hover:not([disabled]) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 8px 0;
  word-break: break-word;
`;

const CardMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 12px;

  & > span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const CardScore = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 4px;
  margin-top: 12px;
`;

const ScoreNumber = styled.span<{ $score?: number }>`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => {
    const score = props.$score || 0;
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  }};
`;

const ScoreLabel = styled.span`
  color: #64748b;
  font-size: 0.85rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0 0 20px 0;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: ${props => (props.$variant === 'danger' ? '#fee2e2' : '#f8fafc')};
  color: ${props => (props.$variant === 'danger' ? '#dc2626' : '#475569')};
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => (props.$variant === 'danger' ? '#fecaca' : '#e2e8f0')};
  }
`;

interface Resume {
  id: string;
  title: string;
  fileType: string;
  fileName?: string;
  createdAt: string;
  isProcessed: boolean;
  overallScore?: number;
}

const ResumeList: React.FC = () => {
  const navigate = useNavigate();
  const { error, success } = useToastModal();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiBaseUrl}/resume-analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch resumes');

      const data = await response.json();
      const resumesList = data.data || [];

      // 并行获取每个简历的分析数据
      const resumesWithAnalysis = await Promise.all(
        resumesList.map(async (resume: Resume) => {
          try {
            const analysisRes = await fetch(`${apiBaseUrl}/resume-analysis/${resume.id}/analysis`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (analysisRes.ok) {
              const analysisData = await analysisRes.json();
              return {
                ...resume,
                overallScore: analysisData.data?.overallScore,
              };
            }
          } catch (e) {
            console.warn(`Failed to fetch analysis for resume ${resume.id}`);
          }
          return resume;
        })
      );

      setResumes(resumesWithAnalysis);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch resumes';
      error(errorMsg, '获取简历失败');
      console.error('Error fetching resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = (resumeId: string) => {
    navigate(`/dashboard/resume/${resumeId}`);
  };

  const handleDeleteResume = async (e: React.MouseEvent, resumeId: string) => {
    e.stopPropagation();

    if (!window.confirm('确定要删除这份简历吗？')) {
      return;
    }

    try {
      setDeletingId(resumeId);
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiBaseUrl}/resume-analysis/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete resume');

      setResumes(resumes.filter(r => r.id !== resumeId));
      success('简历已删除', '删除成功');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete resume';
      error(errorMsg, '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = () => {
    navigate('/dashboard/resume/upload');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container>
        <EmptyState>
          <LoadingSpinner />
          <EmptyText>加载中...</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📄 我的简历</Title>
        <UploadButton onClick={handleUpload}>+ 上传简历</UploadButton>
      </Header>

      {resumes.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <EmptyText>暂无简历，点击下方按钮上传你的第一份简历</EmptyText>
          <UploadButton onClick={handleUpload}>上传简历</UploadButton>
        </EmptyState>
      ) : (
        <CardGrid>
          {resumes.map(resume => (
            <ResumeCard
              key={resume.id}
              onClick={() => handleViewResume(resume.id)}
              $isLoading={deletingId === resume.id}
            >
              <CardTitle>{resume.title}</CardTitle>
              <CardMeta>
                <span>📅 {formatDate(resume.createdAt)}</span>
                <span>📄 {resume.fileType.toUpperCase()}</span>
              </CardMeta>

              {resume.isProcessed && resume.overallScore !== undefined ? (
                <CardScore>
                  <ScoreNumber $score={resume.overallScore}>
                    {Math.round(resume.overallScore)}
                  </ScoreNumber>
                  <ScoreLabel>/ 100</ScoreLabel>
                </CardScore>
              ) : (
                <CardScore>
                  <LoadingSpinner />
                  <ScoreLabel>处理中...</ScoreLabel>
                </CardScore>
              )}

              <CardActions>
                <ActionButton
                  onClick={() => handleViewResume(resume.id)}
                >
                  查看分析
                </ActionButton>
                <ActionButton
                  $variant="danger"
                  onClick={(e) => handleDeleteResume(e, resume.id)}
                >
                  删除
                </ActionButton>
              </CardActions>
            </ResumeCard>
          ))}
        </CardGrid>
      )}
    </Container>
  );
};

export default ResumeList;
