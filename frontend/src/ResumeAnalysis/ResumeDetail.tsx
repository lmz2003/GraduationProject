import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToastModal } from '../components/ui/toast-modal';
import { useResumeAnalysisWebSocket } from '../hooks/useResumeAnalysisWebSocket';
import { useTheme } from '../hooks/useTheme';
import { useAbortController } from '../hooks/useAbortController';
import PDFViewer from './components/PDFViewer';
import AnalysisPanel from './components/AnalysisPanel';
import LoadingModal from './components/LoadingModal';

// ---- SVG Icons ----
const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

interface Resume {
  id: string;
  title: string;
  content: string;
  fileType: string;
  fileName?: string;
  parsedData?: any;
  createdAt: string;
}

// ---- 可拖拽分割线 Hook ----
function useDividerDrag(initialLeft: number, minLeft: number, maxLeft: number) {
  const [leftPercent, setLeftPercent] = useState(initialLeft);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setLeftPercent(Math.min(maxLeft, Math.max(minLeft, pct)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minLeft, maxLeft]);

  return { leftPercent, containerRef, onMouseDown };
}

const ResumeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToastModal();
  const { colors: C } = useTheme();
  const { getSignal, abort } = useAbortController();

  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [stageMessage, setStageMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const { leftPercent, containerRef, onMouseDown } = useDividerDrag(50, 25, 75);

  const fetchAnalysisOnly = useCallback(async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/resume-analysis/${id}/analysis`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: getSignal(),
      });
      if (response.ok) {
        const analysisData = await response.json();
        setAnalysis(analysisData.data);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Error fetching analysis:', e);
      }
    }
  }, [id, getSignal]);

  useResumeAnalysisWebSocket({
    resumeId: id,
    userId: localStorage.getItem('userId') || undefined,
    onProgress: (data) => {
      setAnalysisStage(data.stage);
      setStageMessage(data.message);
    },
    onComplete: (_data) => {
      setAnalysisStage(5);
      fetchAnalysisOnly();
    },
    onError: (data) => {
      error(data.error, '分析失败');
    },
  });

  useEffect(() => {
    if (!id) return;
    fetchData();
    return () => { abort(); };
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const signal = getSignal();

      const [resumeRes, analysisRes] = await Promise.all([
        fetch(`${apiBaseUrl}/resume-analysis/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal,
        }),
        fetch(`${apiBaseUrl}/resume-analysis/${id}/analysis`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal,
        }).catch(() => ({ ok: false }) as any),
      ]);

      if (!resumeRes.ok) throw new Error('Failed to fetch resume');

      const resumeData = await resumeRes.json();
      setResume(resumeData.data);

      if (analysisRes.ok && 'json' in analysisRes) {
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData.data);
        if (analysisData.data?.analysisStage !== undefined) {
          setAnalysisStage(analysisData.data.analysisStage);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      error(errorMsg, '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisStageInfo = (stage: number) => {
    const stageMap: Record<number, { title: string; description: string }> = {
      0: { title: '准备分析', description: '正在初始化分析流程，即将开始...' },
      1: { title: '文本提取', description: '正在提取简历中的文本内容...' },
      2: { title: '结构解析', description: '正在解析简历的结构和信息...' },
      3: { title: '评分分析', description: '正在分析并评估各项指标...' },
      4: { title: '报告生成', description: '正在生成详细的分析报告...' },
      5: { title: '分析完成', description: '分析已完成，正在加载结果...' },
    };
    return stageMap[stage] || stageMap[0];
  };

  if (loading) {
    return <LoadingModal isOpen={loading} title="加载简历" description="正在获取简历信息..." />;
  }

  if (!resume) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: C.font }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <button
            onClick={() => navigate('/dashboard/resume')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '6px', background: C.primarySoft, color: C.primary, padding: '7px 14px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}
          >
            <ArrowLeftIcon /> 返回
          </button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>简历分析</h2>
          <div />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontFamily: C.font }}>
          <p>简历不存在</p>
        </div>
      </div>
    );
  }

  const isPdf = resume.fileType === 'pdf' && resume.fileName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', background: C.bg, overflow: 'hidden', fontFamily: C.font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button
          onClick={() => navigate('/dashboard/resume')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '6px', background: C.primarySoft, color: C.primary, padding: '7px 14px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: C.font, transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.14)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.primarySoft}
        >
          <ArrowLeftIcon /> 返回
        </button>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>{resume.title}</h2>
        <div />
      </div>

      {/* Content — 可拖拽左右分栏 */}
      <div
        ref={containerRef}
        style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}
      >
        {/* Left: PDF / Text viewer */}
        <div style={{ width: `${leftPercent}%`, overflow: 'hidden', background: C.surface, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          {isPdf ? (
            // PDF：撑满整个左栏
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <PDFViewer resumeId={resume.id} />
            </div>
          ) : (
            // 文本：带标题栏 + 可滚动正文
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                flexShrink: 0,
                background: C.surface,
              }}>
                <span style={{ color: C.primary, display: 'flex' }}><FileTextIcon /></span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.textMuted }}>简历原文</span>
              </div>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                fontFamily: C.font,
                fontSize: '0.875rem',
                lineHeight: 1.8,
                color: C.text,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: C.bg,
              }}>
                {resume.content || <span style={{ color: C.textMuted, fontStyle: 'italic' }}>暂无内容</span>}
              </div>
            </div>
          )}
        </div>

        {/* 可拖拽分割线 */}
        <div
          onMouseDown={onMouseDown}
          style={{
            width: '5px',
            flexShrink: 0,
            cursor: 'col-resize',
            background: C.border,
            position: 'relative',
            transition: 'background 0.15s',
            zIndex: 10,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.primary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.border}
        >
          {/* 中间抓手提示点 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '3px',
            height: '32px',
            borderRadius: '2px',
            background: 'currentColor',
            opacity: 0.4,
          }} />
        </div>

        {/* Right: Analysis Panel */}
        <div style={{ flex: 1, overflow: 'hidden', background: C.surface, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          {!analysis ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textMuted, fontFamily: C.font }}>
              <p>等待分析完成...</p>
            </div>
          ) : (
            <AnalysisPanel analysis={analysis} />
          )}
        </div>
      </div>

      {/* Analysis loading modal */}
      {!analysis && (
        <LoadingModal
          isOpen={true}
          title={getAnalysisStageInfo(analysisStage).title}
          description={stageMessage || getAnalysisStageInfo(analysisStage).description}
          showProgress={true}
          progress={analysisStage}
          maxProgress={5}
        />
      )}
    </div>
  );
};

export default ResumeDetail;
