import React, { useState, useEffect, useRef } from 'react';
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

const SectionTitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  margin: 0;
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

const DocumentCard = styled.div<{ $selected?: boolean }>`
  padding: 15px;
  background: ${props => props.$selected ? '#f0f4ff' : '#f8fafc'};
  border: 2px solid ${props => props.$selected ? '#4f46e5' : '#e2e8f0'};
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
`;

const DocumentCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
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

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 10px 15px;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#4f46e5' : 'transparent'};
  color: ${props => props.$active ? '#4f46e5' : '#64748b'};
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #4f46e5;
  }
`;

const DropZone = styled.div<{ $isDragging?: boolean }>`
  border: 2px dashed ${props => props.$isDragging ? '#4f46e5' : '#cbd5e1'};
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  background: ${props => props.$isDragging ? '#f0f4ff' : '#f8fafc'};
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    border-color: #4f46e5;
    background: #f0f4ff;
  }
`;

const DropZoneText = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
  margin-bottom: 8px;
`;

const DropZoneSubtext = styled.p`
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
`;

const FileInput = styled.input`
  display: none;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
`;

const FileItem = styled.div`
  padding: 10px 15px;
  background: #f0f4ff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const FileIcon = styled.span`
  font-size: 1.2rem;
`;

const FileNameText = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileNameMain = styled.div`
  color: #0f172a;
  font-weight: 500;
  font-size: 0.9rem;
`;

const FileSize = styled.div`
  color: #94a3b8;
  font-size: 0.8rem;
`;

const FileRemoveBtn = styled.button`
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: #fecaca;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 15px;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  transition: width 0.3s ease;
`;

const SupportedFormats = styled.div`
  margin-top: 15px;
  padding: 10px;
  background: #f0f4ff;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #475569;
`;

const ProcessingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #92400e;
  margin-bottom: 10px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  &::before {
    content: '⏳';
    display: inline-block;
    animation: spin 2s linear infinite;
  }
`;


const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4f46e5;
`;

const SelectionActions = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #f0f4ff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  margin-bottom: 15px;
  align-items: center;
`;

const SelectionInfo = styled.span`
  color: #475569;
  font-weight: 500;
  margin-right: 10px;
`;

interface Document {
  id: string;
  title: string;
  content: string;
  isProcessed: boolean;
  status: 'uploaded' | 'processing' | 'processed' | 'failed'; // 文档状态
  processingError?: string; // 处理错误信息
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
  const [loadingAdd, setLoadingAdd] = useState(false);  // 添加文档的 loading 状态
  const [loadingQuery, setLoadingQuery] = useState(false);  // 查询的 loading 状态
  const [loadingUpload, setLoadingUpload] = useState(false);  // 文件上传的 loading 状态
  const [loadingReprocess, setLoadingReprocess] = useState<string | null>(null);  // 重新处理文档的 loading 状态（存储文档 ID）

  // 选项卡状态
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 表单状态
  const [newDoc, setNewDoc] = useState({
    title: '',
    content: '',
    source: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [loadingBatchDelete, setLoadingBatchDelete] = useState(false);
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);

  const [query, setQuery] = useState('');

  const token = localStorage.getItem('token');
  const API_BASE = import.meta.env.VITE_API_BASE_URL + '/knowledge-base';

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

    setLoadingAdd(true);
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
      setLoadingAdd(false);
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

    setLoadingQuery(true);
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
      setLoadingQuery(false);
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

  // 重新处理文档
  const handleReprocessDocument = async (docId: string) => {
    if (!window.confirm('确定要重新处理此文档吗？')) {
      return;
    }

    setLoadingReprocess(docId);
    try {
      const response = await fetch(`${API_BASE}/documents/${docId}/reprocess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('文档已提交处理队列，请稍候');
        fetchDocuments();
        fetchStats();
      } else {
        const errorMsg = data.message || '重新处理失败';
        alert(`重新处理失败: ${errorMsg}`);
        console.error('重新处理文档错误:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      console.error('重新处理文档失败:', error);
      alert(`重新处理文档失败: ${errorMsg}。请检查服务器连接`);
    } finally {
      setLoadingReprocess(null);
    }
  };

  // 切换文档选择状态
  const handleDocumentSelect = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  // 全选所有文档
  const handleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
    }
  };

  // 批量删除文档
  const handleBatchDelete = async () => {
    if (selectedDocuments.size === 0) {
      alert('请先选择要删除的文档');
      return;
    }

    if (!window.confirm(`确定要删除 ${selectedDocuments.size} 个文档吗？此操作不可撤销`)) {
      return;
    }

    setLoadingBatchDelete(true);
    try {
      const response = await fetch(`${API_BASE}/documents/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentIds: Array.from(selectedDocuments),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`成功删除 ${data.data?.deletedCount || selectedDocuments.size} 个文档`);
        setSelectedDocuments(new Set());
        fetchDocuments();
        fetchStats();
      } else {
        const errorMsg = data.message || '批量删除失败';
        alert(`批量删除失败: ${errorMsg}`);
        console.error('批量删除错误:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      console.error('批量删除失败:', error);
      alert(`批量删除失败: ${errorMsg}。请检查服务器连接`);
    } finally {
      setLoadingBatchDelete(false);
    }
  };

  // 获取文件图标
  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      'pdf': '📄',
      'docx': '📝',
      'doc': '📝',
      'xlsx': '📊',
      'xls': '📊',
      'csv': '📊',
      'md': '✍️',
      'txt': '📋',
      'json': '⚙️',
    };
    return iconMap[ext] || '📎';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 处理文件选择
  const handleFileSelect = (files: FileList) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const supportedFormats = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.md', '.txt', '.json'];

    const validFiles: File[] = [];
    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!supportedFormats.includes(ext)) {
        alert(`不支持的文件类型: ${ext}。支持的类型: ${supportedFormats.join(', ')}`);
        continue;
      }

      if (file.size > maxFileSize) {
        alert(`文件 ${file.name} 过大，最大支持 50MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...validFiles]);
    }
  };

  // 移除选中的文件
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 上传文件
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('请选择至少一个文件');
      return;
    }

    setLoadingUpload(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      // 使用 XMLHttpRequest 来跟踪上传进度
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // 返回 Promise 来处理上传完成
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              JSON.parse(xhr.responseText);
              resolve(xhr.responseText);
            } catch {
              reject(new Error('响应解析失败'));
            }
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('上传被中止'));
        });

        xhr.open('POST', `${API_BASE}/upload-documents`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const responseText = await uploadPromise;
      const data = JSON.parse(responseText);

      if (data.success) {
        setUploadProgress(100);
        alert(`成功上传 ${data.data?.length || 0} 个文档，后台处理中...`);
        setSelectedFiles([]);
        
        // 获取上传的文档 ID，开始轮询其处理状态
        const uploadedDocumentIds = data.data?.map((doc: Document) => doc.id) || [];
        if (uploadedDocumentIds.length > 0) {
          setProcessingDocuments(new Set(uploadedDocumentIds));
          
          // 开始轮询这些文档的处理状态
          pollDocumentProcessing(uploadedDocumentIds);
        }
        
        setUploadProgress(0);
      } else {
        const errorMsg = data.message || '上传失败';
        alert(`上传失败: ${errorMsg}`);
        console.error('上传文档错误:', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      console.error('上传文档失败:', error);
      alert(`上传文档失败: ${errorMsg}。请检查服务器连接`);
    } finally {
      setLoadingUpload(false);
    }
  };

  // 轮询文档处理状态
  const pollDocumentProcessing = async (documentIds: string[]) => {
    const maxAttempts = 120; // 最多轮询 120 次（360 秒 = 6 分钟）
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        // 获取最新的文档列表
        const response = await fetch(`${API_BASE}/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          const documents = result.data as Document[];
          
          // 检查这些文档的处理状态
          const stillProcessing: Document[] = [];
          const failedDocs: Document[] = [];
          
          documentIds.forEach((id) => {
            const doc = documents.find((d) => d.id === id);
            if (!doc) return;
            
            // 根据 status 判断状态
            if (doc.status === 'processed') {
              // 已处理，不需要继续轮询
            } else if (doc.status === 'failed') {
              // 处理失败，记录
              failedDocs.push(doc);
            } else if (doc.status === 'uploaded' || doc.status === 'processing') {
              // 还在处理中
              stillProcessing.push(doc);
            }
          });

          // 如果没有文档还在处理中，轮询结束
          if (stillProcessing.length === 0) {
            setProcessingDocuments(new Set());
            
            if (failedDocs.length > 0) {
              const failureMsg = failedDocs
                .map((doc) => `${doc.title}${doc.processingError ? ': ' + doc.processingError : ''}`)
                .join('\n');
              alert(`${failedDocs.length} 个文档处理失败:\n${failureMsg}\n\n请重新上传或检查日志`);
            } else {
              alert('所有文档处理完成！');
            }
            
            fetchDocuments();
            fetchStats();
            return;
          }

          // 继续轮询或超时
          if (attempts < maxAttempts) {
            // 每 3 秒轮询一次
            setTimeout(poll, 3000);
          } else {
            // 超时后停止轮询
            console.warn('文档处理超时');
            setProcessingDocuments(new Set());
            alert(`${stillProcessing.length} 个文档处理超时，请稍后手动刷新查看状态`);
            fetchDocuments();
            fetchStats();
          }
        }
      } catch (error) {
        console.error('轮询文档状态失败:', error);
        // 错误时继续轮询
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setProcessingDocuments(new Set());
        }
      }
    };

    // 立即开始第一次轮询
    poll();
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
        
        <Tabs>
          <Tab $active={activeTab === 'text'} onClick={() => setActiveTab('text')}>
            ✍️ 文本输入
          </Tab>
          <Tab $active={activeTab === 'file'} onClick={() => setActiveTab('file')}>
            📁 文件上传
          </Tab>
        </Tabs>

        {activeTab === 'text' ? (
          <>
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
            <Button onClick={handleAddDocument} disabled={loadingAdd}>
              {loadingAdd ? '处理中...' : '添加文档'}
            </Button>
          </>
        ) : (
          <>
            <DropZone
              ref={dropZoneRef}
              $isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <DropZoneText>📁 拖拽文件到此或点击选择</DropZoneText>
              <DropZoneSubtext>支持 PDF、Word、Excel、Markdown、JSON、CSV、TXT 等格式</DropZoneSubtext>
            </DropZone>
            <FileInput
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.md,.txt,.json"
              onChange={(e) => handleFileSelect(e.target.files!)}
            />

            {selectedFiles.length > 0 && (
              <>
                <div style={{ marginTop: '20px' }}>
                  <Label>已选择 {selectedFiles.length} 个文件</Label>
                  <FileList>
                    {selectedFiles.map((file, index) => (
                      <FileItem key={index}>
                        <FileName>
                          <FileIcon>{getFileIcon(file.name)}</FileIcon>
                          <FileNameText>
                            <FileNameMain>{file.name}</FileNameMain>
                            <FileSize>{formatFileSize(file.size)}</FileSize>
                          </FileNameText>
                        </FileName>
                        <FileRemoveBtn onClick={() => handleRemoveFile(index)}>
                          移除
                        </FileRemoveBtn>
                      </FileItem>
                    ))}
                  </FileList>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ marginBottom: '15px' }}>
                    <Label>上传进度: {uploadProgress}%</Label>
                    <ProgressBar>
                      <ProgressFill $progress={uploadProgress} />
                    </ProgressBar>
                  </div>
                )}

                <ButtonGroup>
                  <Button onClick={handleUploadFiles} disabled={loadingUpload}>
                    {loadingUpload ? '上传中...' : '上传文件'}
                  </Button>
                  <Button
                    $variant="secondary"
                    onClick={() => setSelectedFiles([])}
                    disabled={loadingUpload}
                  >
                    清空列表
                  </Button>
                </ButtonGroup>
              </>
            )}

            <SupportedFormats>
              ✅ 支持的文件格式: PDF, Word (docx/doc), Excel (xlsx/xls), CSV, Markdown, JSON, 纯文本
              <br />
              📦 最大单个文件: 50 MB | 最多批量上传: 10 个文件
            </SupportedFormats>
          </>
        )}
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
        <Button onClick={handleQuery} disabled={loadingQuery}>
          {loadingQuery ? '查询中...' : '搜索'}
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
        <SectionTitleContainer>
          <SectionTitle>📚 我的文档</SectionTitle>
          {documents.length > 0 && (
            <>
              <Button
                $variant={isBatchDeleteMode ? 'primary' : 'secondary'}
                onClick={() => {
                  setIsBatchDeleteMode(!isBatchDeleteMode);
                  if (isBatchDeleteMode) {
                    setSelectedDocuments(new Set());
                  }
                }}
              >
                {isBatchDeleteMode ? '✓ 批量删除模式' : '批量删除'}
              </Button>
            </>
          )}
        </SectionTitleContainer>

        {processingDocuments.size > 0 && (
          <ProcessingIndicator>
            {processingDocuments.size} 个文档处理中...
          </ProcessingIndicator>
        )}

        {isBatchDeleteMode && selectedDocuments.size > 0 && (
          <SelectionActions>
            <SelectionInfo>已选择 {selectedDocuments.size} 个文档</SelectionInfo>
            <Button
              onClick={handleSelectAll}
              $variant="secondary"
            >
              {selectedDocuments.size === documents.length ? '取消全选' : '全选'}
            </Button>
            <Button
              onClick={handleBatchDelete}
              disabled={loadingBatchDelete}
              style={{ background: '#dc2626' }}
            >
              {loadingBatchDelete ? '删除中...' : `🗑️ 删除 ${selectedDocuments.size} 个文档`}
            </Button>
          </SelectionActions>
        )}

        {documents.length > 0 ? (
          <DocumentList>
            {documents.map((doc) => {
              // 根据状态决定显示的内容
              const getStatusDisplay = () => {
                switch (doc.status) {
                  case 'processed':
                    return '✅ 已处理';
                  case 'processing':
                    return '⏳ 处理中...';
                  case 'uploaded':
                    return '📤 待处理';
                  case 'failed':
                    return '❌ 处理失败';
                  default:
                    return '⏳ 待处理';
                }
              };

              return (
                <DocumentCard key={doc.id} $selected={selectedDocuments.has(doc.id)}>
                  <DocumentCardContent>
                    {isBatchDeleteMode && (
                      <CheckboxContainer>
                        <Checkbox
                          type="checkbox"
                          checked={selectedDocuments.has(doc.id)}
                          onChange={() => handleDocumentSelect(doc.id)}
                        />
                      </CheckboxContainer>
                    )}
                    <DocumentInfo>
                      <DocumentTitle>{doc.title}</DocumentTitle>
                      <DocumentMeta>
                        {getStatusDisplay()} · {new Date(doc.createdAt).toLocaleDateString()}
                        {doc.status === 'failed' && doc.processingError && (
                          <>
                            <br />
                            <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>
                              错误: {doc.processingError.substring(0, 100)}
                            </span>
                          </>
                        )}
                      </DocumentMeta>
                    </DocumentInfo>
                  </DocumentCardContent>
                  {!isBatchDeleteMode && (
                    <ButtonGroup>
                      {(doc.status === 'uploaded' || doc.status === 'failed') && (
                        <Button
                          onClick={() => handleReprocessDocument(doc.id)}
                          disabled={loadingReprocess === doc.id}
                          title={doc.status === 'failed' ? '重新处理此文档' : '手动处理此文档'}
                        >
                          {loadingReprocess === doc.id ? '处理中...' : '🔄 重新处理'}
                        </Button>
                      )}
                      <Button
                        $variant="secondary"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        删除
                      </Button>
                    </ButtonGroup>
                  )}
                </DocumentCard>
              );
            })}
          </DocumentList>
        ) : (
          <p style={{ color: '#64748b', margin: 0 }}>暂无文档</p>
        )}
      </Section>
    </Container>
  );
};

export default KnowledgeBase;
