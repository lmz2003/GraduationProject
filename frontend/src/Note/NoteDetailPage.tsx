import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import MarkdownEditor from './MarkdownEditor';

// ========== 样式组件 ==========
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
`;

const Header = styled.div`
  background: white;
  padding: 15px 30px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
  }
`;

const TitleInput = styled.input`
  font-size: 20px;
  font-weight: 600;
  border: 1px solid transparent;
  background: transparent;
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 300px;
  
  &:hover {
    border-color: #e2e8f0;
  }
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: white;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const StatusSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #4f46e5;
          color: white;
          &:hover { background: #4338ca; }
        `;
      case 'danger':
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      default:
        return `
          background: #f1f5f9;
          color: #475569;
          &:hover { background: #e2e8f0; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MetaBar = styled.div`
  background: white;
  padding: 12px 30px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-shrink: 0;
`;

const MetaLabel = styled.span`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const TagsInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const TagsList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TagRemove = styled.button`
  background: none;
  border: none;
  color: #7c3aed;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  
  &:hover {
    color: #6d28d9;
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  overflow: hidden;
  padding: 20px 30px;
`;

const SaveIndicator = styled.div<{ saving?: boolean }>`
  font-size: 13px;
  color: ${props => props.saving ? '#f59e0b' : '#10b981'};
`;

// ========== 接口类型 ==========
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

// ========== 主组件 ==========
const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const isNewNote = id === 'new';

  // 获取笔记详情
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

  // 监听内容变化
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

  // 保存笔记
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const noteData = {
        title: title || '未命名笔记',
        content,
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
        setHasChanges(false);
        if (isNewNote) {
          navigate(`/dashboard/notes/${result.data.id}`);
        } else {
          setNote(result.data);
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

  // 删除笔记
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

  // 添加标签
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 返回列表
  const handleBack = () => {
    if (hasChanges && !confirm('有未保存的修改，确定要离开吗？')) {
      return;
    }
    navigate('/dashboard/notes');
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          加载中...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <BackButton onClick={handleBack}>
            ← 返回列表
          </BackButton>
          <TitleInput
            placeholder="未命名笔记"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </HeaderLeft>
        
        <HeaderActions>
          <SaveIndicator saving={saving}>
            {saving ? '保存中...' : hasChanges ? '有未保存的修改' : '已保存'}
          </SaveIndicator>
          
          <StatusSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </StatusSelect>
          
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            💾 保存
          </Button>
          
          {!isNewNote && (
            <Button variant="danger" onClick={handleDelete}>
              🗑️ 删除
            </Button>
          )}
        </HeaderActions>
      </Header>

      <MetaBar>
        <MetaLabel>标签:</MetaLabel>
        <TagsList>
          {tags.map((tag, index) => (
            <Tag key={index}>
              {tag}
              <TagRemove onClick={() => handleRemoveTag(tag)}>×</TagRemove>
            </Tag>
          ))}
        </TagsList>
        <TagsInput
          placeholder="添加标签（回车确认）"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
        />
      </MetaBar>

      <EditorContainer>
        <MarkdownEditor
          initialContent={content}
          onContentChange={setContent}
        />
      </EditorContainer>
    </PageContainer>
  );
};

export default NoteDetailPage;
