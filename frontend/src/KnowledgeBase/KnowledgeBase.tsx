import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
`;

const Section = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 600;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
`;

const Label = styled.label`
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 120px;
  font-family: 'Inter', sans-serif;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 16px;
  background: ${props => props.$variant === 'secondary' ? '#e2e8f0' : '#4f46e5'};
  color: ${props => props.$variant === 'secondary' ? '#0f172a' : 'white'};
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'secondary' ? '#cbd5e1' : '#4338ca'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const DocumentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DocumentCard = styled.div`
  padding: 15px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentTitle = styled.h4`
  margin: 0 0 5px 0;
  color: #0f172a;
  font-size: 0.95rem;
`;

const DocumentMeta = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
`;

const ResultCard = styled.div`
  padding: 15px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 10px;
`;

const ResultTitle = styled.h4`
  margin: 0 0 5px 0;
  color: #0f172a;
  font-size: 0.95rem;
`;

const ResultScore = styled.span`
  display: inline-block;
  background: #4f46e5;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 10px;
`;

const ResultContent = styled.p`
  margin: 8px 0 0 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 5px;
`;

interface Document {
  id: string;
  title: string;
  content: string;
  isProcessed: boolean;
  createdAt: string;
}

interface QueryResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [stats, setStats] = useState({ totalDocuments: 0, processedDocuments: 0, pendingDocuments: 0 });
  const [loading, setLoading] = useState(false);

  // 表单状态
  const [newDoc, setNewDoc] = useState({
    title: '',
    content: '',
    source: '',
  });

  const [query, setQuery] = useState('');

  const token = localStorage.getItem('token');
  const API_BASE = 'http://localhost:3001/api/knowledge-base';

  // 获取文档列表
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data || []);
      } else {
        console.error('获取文档列表失败:', data.message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('获取文档失败:', error, errorMsg);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data || { totalDocuments: 0, processedDocuments: 0, pendingDocuments: 0 });
      } else {
        console.error('获取统计信息失败:', data.message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('获取统计信息失败:', error, errorMsg);
    }
  };

  // 初始化
  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  // 添加文档
  const handleAddDocument = async () => {
    if (!newDoc.title || !newDoc.content) {
      alert('请填写标题和内容');
      return;
    }

    // 客户端验证
    if (newDoc.title.length > 500) {
      alert('文档标题不能超过 500 个字符');
      return;
    }

    if (newDoc.source && newDoc.source.length > 2000) {
      alert('文档来源不能超过 2000 个字符');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newDoc),
      });

      const data = await response.json();
      if (data.success) {
        alert('文档已添加');
        setNewDoc({ title: '', content: '', source: '' });
        fetchDocuments();
        fetchStats();
      } else {
        // 显示更详细的错误信息
        const errorMsg = data.message || '添加失败';
        alert(`添加失败: ${errorMsg}`);
        console.error('添加文档错误:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      console.error('添加文档失败:', error);
      alert(`添加文档失败: ${errorMsg}。请检查服务器连接`);
    } finally {
      setLoading(false);
    }
  };

  // 查询知识库
  const handleQuery = async () => {
    if (!query) {
      alert('请输入查询内容');
      return;
    }

    // 客户端验证
    if (query.length > 5000) {
      alert('查询内容不能超过 5000 个字符');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          topK: 5,
          threshold: 0.5,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setQueryResults(data.data);
        if (data.data.length === 0) {
          alert('未找到匹配的文档');
        }
      } else {
        // 显示更详细的错误信息
        const errorMsg = data.message || '查询失败';
        alert(`查询失败: ${errorMsg}`);
        console.error('查询知识库错误:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      console.error('查询失败:', error);
      alert(`查询失败: ${errorMsg}。请检查服务器连接`);
    } finally {
      setLoading(false);
    }
  };

  // 删除文档
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('确定要删除此文档吗？')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('文档已删除');
        fetchDocuments();
        fetchStats();
      } else {
        // 显示更详细的错误信息
        const errorMsg = data.message || '删除失败';
        alert(`删除失败: ${errorMsg}`);
        console.error('删除文档错误:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      console.error('删除文档失败:', error);
      alert(`删除文档失败: ${errorMsg}。请检查服务器连接`);
    }
  };

  return (
    <Container>
      {/* 统计信息 */}
      <Section>
        <SectionTitle>📊 知识库统计</SectionTitle>
        <Stats>
          <StatCard>
            <StatValue>{stats.totalDocuments}</StatValue>
            <StatLabel>总文档数</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.processedDocuments}</StatValue>
            <StatLabel>已处理</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.pendingDocuments}</StatValue>
            <StatLabel>待处理</StatLabel>
          </StatCard>
        </Stats>
      </Section>

      {/* 添加文档 */}
      <Section>
        <SectionTitle>📄 添加新文档</SectionTitle>
        <FormGroup>
          <Label>文档标题</Label>
          <Input
            type="text"
            placeholder="输入文档标题"
            value={newDoc.title}
            onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
          />
        </FormGroup>
        <FormGroup>
          <Label>文档内容</Label>
          <Textarea
            placeholder="输入文档内容"
            value={newDoc.content}
            onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
          />
        </FormGroup>
        <FormGroup>
          <Label>来源（可选）</Label>
          <Input
            type="text"
            placeholder="输入文档来源 URL 或路径"
            value={newDoc.source}
            onChange={(e) => setNewDoc({ ...newDoc, source: e.target.value })}
          />
        </FormGroup>
        <Button onClick={handleAddDocument} disabled={loading}>
          {loading ? '处理中...' : '添加文档'}
        </Button>
      </Section>

      {/* 查询知识库 */}
      <Section>
        <SectionTitle>🔍 查询知识库</SectionTitle>
        <FormGroup>
          <Label>查询内容</Label>
          <Textarea
            placeholder="输入您的问题或查询内容"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </FormGroup>
        <Button onClick={handleQuery} disabled={loading}>
          {loading ? '查询中...' : '搜索'}
        </Button>

        {queryResults.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>查询结果 ({queryResults.length})</h4>
            {queryResults.map((result) => (
              <ResultCard key={result.id}>
                <ResultTitle>
                  {result.title}
                  <ResultScore>{(result.score * 100).toFixed(1)}%</ResultScore>
                </ResultTitle>
                <ResultContent>{result.content.substring(0, 200)}...</ResultContent>
              </ResultCard>
            ))}
          </div>
        )}
      </Section>

      {/* 文档列表 */}
      <Section>
        <SectionTitle>📚 我的文档</SectionTitle>
        {documents.length > 0 ? (
          <DocumentList>
            {documents.map((doc) => (
              <DocumentCard key={doc.id}>
                <DocumentInfo>
                  <DocumentTitle>{doc.title}</DocumentTitle>
                  <DocumentMeta>
                    {doc.isProcessed ? '✅ 已处理' : '⏳ 待处理'} · 
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </DocumentMeta>
                </DocumentInfo>
                <ButtonGroup>
                  <Button
                    $variant="secondary"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    删除
                  </Button>
                </ButtonGroup>
              </DocumentCard>
            ))}
          </DocumentList>
        ) : (
          <p style={{ color: '#64748b', margin: 0 }}>暂无文档</p>
        )}
      </Section>
    </Container>
  );
};

export default KnowledgeBase;
