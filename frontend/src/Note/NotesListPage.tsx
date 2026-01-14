import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
  padding: 20px 30px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${props => props.variant === 'primary' ? `
    background: #4f46e5;
    color: white;
    &:hover {
      background: #4338ca;
    }
  ` : `
    background: #f1f5f9;
    color: #475569;
    &:hover {
      background: #e2e8f0;
    }
  `}
`;

const FiltersBar = styled.div`
  background: white;
  padding: 15px 30px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const Select = styled.select`
  padding: 10px 15px;
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

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
`;

const NotesList = styled.div`
  display: grid;
  gap: 15px;
`;

const NoteCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
  }
`;

const NoteCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const NoteTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
`;

const NoteActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
  }
  
  &.delete:hover {
    background: #fee;
    color: #dc2626;
  }
`;

const NoteContent = styled.p`
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const NoteMeta = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.status === 'published' ? `
    background: #d1fae5;
    color: #065f46;
  ` : `
    background: #fef3c7;
    color: #92400e;
  `}
`;

const TimeText = styled.span`
  font-size: 13px;
  color: #94a3b8;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
  margin-top: 20px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: ${props => props.active ? '#4f46e5' : 'white'};
  color: ${props => props.active ? 'white' : '#475569'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: ${props => props.active ? '#4338ca' : '#f1f5f9'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  margin: 0;
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
    <PageContainer>
      <Header>
        <Title>所有笔记</Title>
        <HeaderActions>
          <Button variant="primary" onClick={handleCreateNote}>
            ➕ 新建笔记
          </Button>
        </HeaderActions>
      </Header>

      <FiltersBar>
        <SearchInput
          placeholder="搜索笔记标题..."
          value={queryParams.keyword}
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        <Select
          value={queryParams.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </Select>

        <Select
          value={queryParams.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="updatedAt">最后修改时间</option>
          <option value="createdAt">创建时间</option>
          <option value="title">标题</option>
        </Select>

        <Select
          value={queryParams.order}
          onChange={(e) => handleFilterChange('order', e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </Select>
      </FiltersBar>

      <ContentArea>
        {loading ? (
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <EmptyText>加载中...</EmptyText>
          </EmptyState>
        ) : notes.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📝</EmptyIcon>
            <EmptyText>还没有笔记，点击上方按钮新建一条吧</EmptyText>
          </EmptyState>
        ) : (
          <>
            <NotesList>
              {notes.map(note => (
                <NoteCard key={note.id} onClick={() => handleViewNote(note.id)}>
                  <NoteCardHeader>
                    <NoteTitle>{note.title}</NoteTitle>
                    <NoteActions>
                      <ActionButton
                        className="delete"
                        onClick={(e) => handleDelete(note.id, e)}
                      >
                        🗑️ 删除
                      </ActionButton>
                    </NoteActions>
                  </NoteCardHeader>
                  
                  <NoteContent>{note.summary || note.content}</NoteContent>
                  
                  <NoteMeta>
                    <StatusBadge status={note.status}>
                      {note.status === 'published' ? '已发布' : '草稿'}
                    </StatusBadge>
                    
                    {note.tags && note.tags.length > 0 && note.tags.map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                    
                    <TimeText>
                      更新于 {formatDate(note.updatedAt)}
                    </TimeText>
                  </NoteMeta>
                </NoteCard>
              ))}
            </NotesList>

            <Pagination>
              <PageButton
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                上一页
              </PageButton>
              
              <span>
                第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页
                （共 {pagination.total} 条）
              </span>
              
              <PageButton
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                下一页
              </PageButton>
            </Pagination>
          </>
        )}
      </ContentArea>
    </PageContainer>
  );
};

export default NotesListPage;
