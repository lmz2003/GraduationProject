import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';
import PdfExportModal from '../components/PdfExportModal';
import AIAssistant from '../AIAssistant/AIAssistant';
import { AIAssistantProvider } from '../context/AIAssistantContext';
import { useWebSocket } from '../hooks/useWebSocket';
import styles from './NoteDetailPage.module.scss';

interface Note {
  id: string;
  title: string;
  content: string;
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
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [mainWidthPercent, setMainWidthPercent] = useState<number>(() => {
    const saved = localStorage.getItem('noteLayoutWidth');
    return saved ? parseInt(saved) : 60;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const isNewNote = id === 'new';

  const fetchNote = async () => {
    if (isNewNote) return;

    setLoading(true);
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
        setHtmlContent(noteData.content);
        setTags(noteData.tags || []);
        setStatus(noteData.status);
      }
    } catch (error) {
      console.error('获取笔记失败:', error);
      alert('获取笔记失败');
      navigate('/dashboard/notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [id]);

  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;
  const { on, off } = useWebSocket(isNewNote ? undefined : id, userId);

  useEffect(() => {
    if (isNewNote) return;

    const handleNeedsSync = (data: any) => {
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
        JSON.stringify(tags) !== JSON.stringify(note.tags) ||
        status !== note.status;
      setHasChanges(changed);
      
      setNeedsSync(note.needsSync || false);
      setShowSyncButton(note.knowledgeDocumentId ? note.needsSync || false : false);
    } else if (isNewNote) {
      setHasChanges(title.length > 0 || content.length > 0 || tags.length > 0);
      setShowSyncButton(false);
    }
  }, [title, content, tags, status, note]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const noteData = {
        title: title || '未命名笔记',
        content: htmlContent,
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
        alert('保存成功');

        // 保存成功后，更新 note 和 content 确保 hasChanges 判断正确
        const savedNote = result.data;
        setNote(savedNote);
        setTitle(savedNote.title);
        setContent(savedNote.content);
        setHtmlContent(savedNote.content);
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
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确认删除这条笔记吗？删除后将无法恢复。')) {
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
        alert('删除成功');
        navigate('/dashboard/notes');
      } else {
        throw new Error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleExportHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || '未命名笔记'}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePdfSettings = () => {
    setShowPdfSettings(true);
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

  const handleBack = () => {
    if (hasChanges && !confirm('有未保存的修改，确定要离开吗？')) {
      return;
    }
    navigate('/dashboard/notes');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const container = document.querySelector(`.${styles.pageContainer}`);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    const mouseXRelative = e.clientX - containerRect.left;

    const newMainWidthPercent = (mouseXRelative / containerWidth) * 100;

    if (newMainWidthPercent >= 35 && newMainWidthPercent <= 80) {
      setMainWidthPercent(newMainWidthPercent);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    localStorage.setItem('noteLayoutWidth', Math.round(mainWidthPercent).toString());
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const container = document.querySelector(`.${styles.pageContainer}`);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    const touchXRelative = e.touches[0].clientX - containerRect.left;

    const newMainWidthPercent = (touchXRelative / containerWidth) * 100;

    if (newMainWidthPercent >= 35 && newMainWidthPercent <= 80) {
      setMainWidthPercent(newMainWidthPercent);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    localStorage.setItem('noteLayoutWidth', Math.round(mainWidthPercent).toString());
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleSyncToKnowledge = async () => {
    if (!confirm('确认将更新后的笔记内容同步到知识库吗？')) {
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
        alert('笔记已成功同步到知识库');
        setNeedsSync(false);
        setShowSyncButton(false);
        await fetchNote();
      } else {
        throw new Error(result.message || '同步到知识库失败');
      }
    } catch (error) {
      console.error('同步到知识库失败:', error);
      alert('同步到知识库失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          加载中...
        </div>
      </div>
    );
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
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleBack}>
              ← 返回列表
            </button>
            <input
              className={styles.titleInput}
              placeholder="未命名笔记"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.headerActions}>
            <div className={`${styles.saveIndicator} ${saving ? styles.saving : ''}`}>
              {saving ? '保存中...' : hasChanges ? '有未保存的修改' : '已保存'}
            </div>

            {showSyncButton && (
              <button
                className={`${styles.button} ${styles.syncButton}`}
                onClick={handleSyncToKnowledge}
                disabled={!needsSync}
                title={needsSync ? '需要同步到知识库' : '已同步到知识库'}
              >
                📚 {needsSync ? '同步到知识库' : '已同步'}
              </button>
            )}

            <select
              className={styles.statusSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="笔记状态"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>

            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              💾 保存
            </button>

            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={handleExportHtml}
            >
              📥 导出HTML
            </button>

            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={handlePdfSettings}
            >
              📄 导出PDF
            </button>

            <button
              className={`${styles.button} ${showAI ? styles.active : styles.secondary}`}
              onClick={() => setShowAI(!showAI)}
            >
              🤖 AI助手
            </button>

            {!isNewNote && (
              <button
                className={`${styles.button} ${styles.danger}`}
                onClick={handleDelete}
              >
                🗑️ 删除
              </button>
            )}
          </div>
        </div>

        <div className={styles.metaBar}>
          <span className={styles.metaLabel}>标签:</span>
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

        <div className={styles.contentWrapper}>
          <div className={styles.editorContainer}>
            <RichTextEditor
              initialContent={content}
              onContentChange={setContent}
              onHtmlChange={setHtmlContent}
            />
          </div>
        </div>
      </div>

      {showAI && (
        <>
          <div
            className={`${styles.resizer} ${isDragging ? styles.resizing : ''}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
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

      <PdfExportModal
        isOpen={showPdfSettings}
        onClose={() => setShowPdfSettings(false)}
        previewRef={previewRef}
        htmlContent={htmlContent}
      />
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
