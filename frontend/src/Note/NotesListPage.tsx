import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotesListPage.module.scss';

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

interface QueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  tag?: string;
  status?: string;
  sortBy: string;
  order: 'asc' | 'desc';
}

// ========== 主组件 ==========
const NotesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
    tag: '',
    status: '',
    sortBy: 'updatedAt',
    order: 'desc',
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  // 获取笔记列表
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 构建查询字符串
      const params = new URLSearchParams();
      params.append('page', queryParams.page.toString());
      params.append('pageSize', queryParams.pageSize.toString());
      if (queryParams.keyword) params.append('keyword', queryParams.keyword);
      if (queryParams.tag) params.append('tag', queryParams.tag);
      if (queryParams.status) params.append('status', queryParams.status);
      params.append('sortBy', queryParams.sortBy);
      params.append('order', queryParams.order);

      const response = await fetch(`${API_BASE}/notes?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取笔记列表失败');
      }

      const result = await response.json();
      if (result.code === 0) {
        setNotes(result.data.list);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('获取笔记列表失败:', error);
      alert('获取笔记列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchNotes();
  }, [queryParams]);

  // 搜索处理
  const handleSearch = (keyword: string) => {
    setQueryParams(prev => ({ ...prev, keyword, page: 1 }));
  };

  // 筛选处理
  const handleFilterChange = (key: keyof QueryParams, value: string) => {
    setQueryParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // 翻页处理
  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  };

  // 删除笔记
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
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
        fetchNotes();
      } else {
        throw new Error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 跳转到详情页
  const handleViewNote = (id: string) => {
    navigate(`/dashboard/notes/${id}`);
  };

  // 新建笔记
  const handleCreateNote = () => {
    navigate('/dashboard/notes/new');
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>所有笔记</h2>
        <div className={styles.headerActions}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleCreateNote}
          >
            ➕ 新建笔记
          </button>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <input
          className={styles.searchInput}
          placeholder="搜索笔记标题..."
          value={queryParams.keyword}
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        <select
          aria-label="状态筛选"
          className={styles.select}
          value={queryParams.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>

        <select
          aria-label="排序字段"
          className={styles.select}
          value={queryParams.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="updatedAt">最后修改时间</option>
          <option value="createdAt">创建时间</option>
          <option value="title">标题</option>
        </select>

        <select
          aria-label="排序顺序"
          className={styles.select}
          value={queryParams.order}
          onChange={(e) => handleFilterChange('order', e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>

      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⏳</div>
            <p className={styles.emptyText}>加载中...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <p className={styles.emptyText}>还没有笔记，点击上方按钮新建一条吧</p>
          </div>
        ) : (
          <>
            <div className={styles.notesList}>
              {notes.map(note => (
                <div
                  key={note.id}
                  className={styles.noteCard}
                  onClick={() => handleViewNote(note.id)}
                >
                  <div className={styles.noteCardHeader}>
                    <h3 className={styles.noteTitle}>{note.title}</h3>
                    <div className={styles.noteActions}>
                      <button
                        className={`${styles.actionButton} ${styles.actionDelete}`}
                        onClick={(e) => handleDelete(note.id, e)}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                  
                  <p className={styles.noteContent}>{note.summary || note.content}</p>
                  
                  <div className={styles.noteMeta}>
                    <span
                      className={`${styles.statusBadge} ${note.status === 'published' ? styles.statusPublished : styles.statusDraft}`}
                    >
                      {note.status === 'published' ? '已发布' : '草稿'}
                    </span>
                    
                    {note.tags && note.tags.length > 0 && note.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                    
                    <span className={styles.timeText}>
                      更新于 {formatDate(note.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                上一页
              </button>
              
              <span>
                第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页
                （共 {pagination.total} 条）
              </span>
              
              <button
                className={styles.pageButton}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotesListPage;
