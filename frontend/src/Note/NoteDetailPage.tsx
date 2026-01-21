import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';
import PdfExportModal from '../components/PdfExportModal';
import AIAssistant from '../AIAssistant/AIAssistant';
import { AIAssistantProvider } from '../context/AIAssistantContext';
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
  const [aiWidth, setAiWidth] = useState(350);
  const [isDragging, setIsDragging] = useState(false);
  console.log(`aiWidth state: ${aiWidth}`);
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

  useEffect(() => {
    if (note) {
      const changed =
        title !== note.title ||
        content !== note.content ||
        JSON.stringify(tags) !== JSON.stringify(note.tags) ||
        status !== note.status;
      setHasChanges(changed);
    } else if (isNewNote) {
      setHasChanges(title.length > 0 || content.length > 0 || tags.length > 0);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mouse down on resizer');
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector(`.${styles.pageContainer}`);
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newAiWidth = containerRect.right - e.clientX;
    
    console.log(`Mouse move: clientX=${e.clientX}, containerRect.right=${containerRect.right}, newAiWidth=${newAiWidth}`);
    
    if (newAiWidth >= 250 && newAiWidth <= 600) {
      setAiWidth(newAiWidth);
      console.log(`Set aiWidth: ${newAiWidth}`);
    } else {
      console.log(`newAiWidth out of range: ${newAiWidth}`);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up');
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

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
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
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

            <select
              className={styles.statusSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
          />
          <div className={styles.aiContainer} style={{ width: `${aiWidth}px` }}>
            <div className={styles.aiHeader}>
              <span className={styles.aiTitle}>🤖 AI 助手</span>
            </div>
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
