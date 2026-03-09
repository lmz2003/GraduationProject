import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToastModal } from '../components/ui/toast-modal';
import {PlateEditor} from '../components/editor/plate-editor';
import AIAssistant from '../AIAssistant/AIAssistant';
import { AIAssistantProvider } from '../context/AIAssistantContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Bot, 
  CloudUpload, 
  CloudCheck,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Pencil
} from 'lucide-react';
import styles from './NoteDetailPage.module.scss';

interface Note {
  id: string;
  title: string;
  content: string; // Plate 编辑器格式，JSON 序列化字符串
  summary?: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  knowledgeDocumentId?: string;
  syncedToKnowledgeAt?: string;
  needsSync?: boolean;
}

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toastModal = useToastModal();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('draft');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [mainWidthPercent, setMainWidthPercent] = useState<number>(() => {
    const saved = localStorage.getItem('noteLayoutWidth');
    const defaultValue = saved ? parseInt(saved) : 67;
    return Math.max(67, Math.min(80, defaultValue));
  });
  const [isDragging, setIsDragging] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const isNewNote = id === 'new';

  const fetchNote = async () => {
    if (isNewNote) {
      setDataLoaded(true);
      return;
    }

    toastModal.loading('正在加载笔记详情...', '加载中');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/notes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取笔记失败');
      }

      const result = await response.json();
      if (result.code === 0) {
        const noteData = result.data;
        setNote(noteData);
        setTitle(noteData.title);
        setContent(noteData.content);
        setSummary(noteData.summary || '');
        setTags(noteData.tags || []);
        setStatus(noteData.status);
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('获取笔记失败:', error);
      toastModal.error('获取笔记失败');
      navigate('/dashboard/notes');
    } finally {
      toastModal.closeLoading();
    }
  };

  useEffect(() => {
    fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;
  const { on, off } = useWebSocket(isNewNote ? undefined : id, userId);

  useEffect(() => {
    if (isNewNote) return;

    const handleNeedsSync = (data: Record<string, unknown>) => {
      console.log('收到同步提示:', data);
      if (data.noteId === id) {
        setNeedsSync(true);
        setShowSyncButton(true);
      }
    };

    on('note-needs-sync', handleNeedsSync);

    return () => {
      off('note-needs-sync', handleNeedsSync);
    };
  }, [id, isNewNote, on, off]);

  useEffect(() => {
    if (note) {
      const changed =
        title !== note.title ||
        content !== note.content ||
        summary !== (note.summary || '') ||
        JSON.stringify(tags) !== JSON.stringify(note.tags) ||
        status !== note.status;
      setHasChanges(changed);
      
      setNeedsSync(note.needsSync || false);
      setShowSyncButton(note.knowledgeDocumentId ? note.needsSync || false : false);
    } else if (isNewNote) {
      setHasChanges(title.length > 0 || content.length > 0 || tags.length > 0);
      setShowSyncButton(false);
    }
  }, [title, content, summary, tags, status, note, isNewNote]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const noteData = {
        title: title || '未命名笔记',
        content: content,
        summary: summary || undefined,
        tags,
        status,
      };

      let response;
      if (isNewNote) {
        response = await fetch(`${API_BASE}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(noteData),
        });
      } else {
        response = await fetch(`${API_BASE}/notes/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(noteData),
        });
      }

      const result = await response.json();
      if (result.code === 0) {
        await toastModal.success('保存成功');

        // 保存成功后，更新 note 和 content 确保 hasChanges 判断正确
        const savedNote = result.data;
        setNote(savedNote);
        setTitle(savedNote.title);
        setContent(savedNote.content);
        setSummary(savedNote.summary || '');
        setTags(savedNote.tags || []);
        setStatus(savedNote.status);
        setHasChanges(false);

        if (isNewNote) {
          navigate(`/dashboard/notes/${savedNote.id}`);
        }
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      await toastModal.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [title, content, summary, tags, status, isNewNote, id, API_BASE, navigate]);

  const handleDelete = async () => {
    const confirmed = await toastModal.confirm(
      '确认删除这条笔记吗？删除后将无法恢复。',
      '确认删除'
    );
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.code === 0) {
        await toastModal.success('删除成功');
        navigate('/dashboard/notes');
      } else {
        throw new Error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      await toastModal.error('删除失败');
    }
  };


  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleBack = async () => {
    if (hasChanges) {
      const confirmed = await toastModal.confirm(
        '有未保存的修改，确定要离开吗？',
        '确认离开'
      );
      if (!confirmed) {
        return;
      }
    }
    navigate('/dashboard/notes');
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector(`.${styles.pageContainer}`);
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;

      const mouseXRelative = e.clientX - containerRect.left;

      const newMainWidthPercent = (mouseXRelative / containerWidth) * 100;

      if (newMainWidthPercent >= 67 && newMainWidthPercent <= 80) {
        setMainWidthPercent(newMainWidthPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('noteLayoutWidth', Math.round(mainWidthPercent).toString());
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = document.querySelector(`.${styles.pageContainer}`);
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;

      const touchXRelative = e.touches[0].clientX - containerRect.left;

      const newMainWidthPercent = (touchXRelative / containerWidth) * 100;

      if (newMainWidthPercent >= 67 && newMainWidthPercent <= 80) {
        setMainWidthPercent(newMainWidthPercent);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      localStorage.setItem('noteLayoutWidth', Math.round(mainWidthPercent).toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, mainWidthPercent]);

  const handleSyncToKnowledge = async () => {
    const confirmed = await toastModal.confirm(
      '确认将更新后的笔记内容同步到知识库吗？',
      '确认同步'
    );
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notes/${id}/sync-to-knowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.code === 0) {
        await toastModal.success('笔记已成功同步到知识库');
        setNeedsSync(false);
        setShowSyncButton(false);
        await fetchNote();
      } else {
        throw new Error(result.message || '同步到知识库失败');
      }
    } catch (error) {
      console.error('同步到知识库失败:', error);
      await toastModal.error('同步到知识库失败，请稍后重试');
    }
  };

  // 监听快捷键保存 (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否按下了 Ctrl+S (Windows/Linux) 或 Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // 只有当有未保存的修改且没有正在保存时才执行保存
        if (hasChanges && !saving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, saving, handleSave]);

  if (!dataLoaded) {
    return null;
  }

  return (
    <div 
      className={`${styles.pageContainer} ${isDragging ? styles.dragging : ''}`}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: `0 0 ${showAI ? mainWidthPercent : 100}%`,
        minWidth: 0,
        height: '100%'
      }}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack}>
              <ArrowLeft size={16} />
              <span>返回</span>
            </button>
            
            <div className={styles.titleWrapper}>
              <Pencil size={18} className={styles.titleIcon} />
              <input
                className={styles.titleInput}
                placeholder="输入笔记标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.headerRight}>
            {showSyncButton && (
              <button
                className={`${styles.button} ${styles.syncButton}`}
                onClick={handleSyncToKnowledge}
                disabled={!needsSync}
                title={needsSync ? '需要同步到知识库' : '已同步到知识库'}
              >
                {needsSync ? (
                  <>
                    <CloudUpload size={16} />
                    <span>同步</span>
                  </>
                ) : (
                  <>
                    <CloudCheck size={16} />
                    <span>已同步</span>
                  </>
                )}
              </button>
            )}

            <div className={`${styles.saveIndicator} ${saving ? styles.saving : ''} ${hasChanges ? styles.unsaved : ''}`}>
              {saving ? (
                <>
                  <Loader2 size={14} className={styles.spinIcon} />
                  <span>保存中</span>
                </>
              ) : hasChanges ? (
                <>
                  <AlertCircle size={14} />
                  <span>未保存</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>已保存</span>
                </>
              )}
            </div>

            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              <Save size={16} />
              <span>保存</span>
            </button>

            <div className={styles.statusWrapper}>
              <FileText size={14} className={styles.statusIcon} />
              <select
                className={styles.statusSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="笔记状态"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>

            {!isNewNote && (
              <button
                className={`${styles.button} ${styles.danger}`}
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                <span>删除</span>
              </button>
            )}

            <button
              className={`${styles.button} ${showAI ? styles.active : styles.secondary}`}
              onClick={() => setShowAI(!showAI)}
            >
              <Bot size={16} />
              <span>AI助手</span>
            </button>
          </div>
        </header>


        <div className={styles.metaBar}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
            {/* 摘要编辑区域 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.metaLabel} style={{ minWidth: '60px' }}>摘要:</span>
              <input
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
                placeholder="笔记摘要（留空则自动生成）"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                title="输入自定义摘要，或留空让 AI 自动生成"
              />
            </div>
            
            {/* 标签编辑区域 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className={styles.metaLabel} style={{ minWidth: '60px' }}>标签:</span>
              <div className={styles.tagsList}>
                {tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                    <button
                      className={styles.tagRemove}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                className={styles.tagsInput}
                placeholder="添加标签（回车确认）"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
            </div>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.editorContainer} ref={previewRef}>
            <PlateEditor 
              initialValue={content}
              onContentChange={setContent}
            />
          </div>
        </div>
      </div>

      {showAI && (
        <>
          <div
            className={`${styles.resizer} ${isDragging ? styles.resizing : ''}`}
            onMouseDown={handleMouseDown}
          />
          <div 
            className={styles.aiContainer}
            style={{
              flex: `0 0 ${100 - mainWidthPercent}%`,
              minWidth: 0
            }}
          >
            <div className={styles.aiContent}>
              <AIAssistant />
            </div>
          </div>
        </>
      )}

    </div>
  );
};

// Wrapper component to provide AI Assistant context
const NoteDetailPageWithProvider: React.FC = () => {
  return (
    <AIAssistantProvider>
      <NoteDetailPage />
    </AIAssistantProvider>
  );
};

export default NoteDetailPageWithProvider;
