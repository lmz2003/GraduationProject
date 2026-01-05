import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { MilvusService } from './services/milvus.service';
import { LangChainService } from './services/langchain.service';

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;
  let mockDocumentRepository: any;
  let mockMilvusService: any;
  let mockLangChainService: any;

  beforeEach(async () => {
    // 创建模拟对象
    mockDocumentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockMilvusService = {
      insertVector: jest.fn(),
      searchSimilar: jest.fn(),
      deleteVector: jest.fn(),
    };

    mockLangChainService = {
      processDocument: jest.fn(),
      generateEmbedding: jest.fn(),
      buildRAGPrompt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeBaseService,
        {
          provide: getRepositoryToken(KnowledgeDocument),
          useValue: mockDocumentRepository,
        },
        {
          provide: MilvusService,
          useValue: mockMilvusService,
        },
        {
          provide: LangChainService,
          useValue: mockLangChainService,
        },
      ],
    }).compile();

    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
  });

  describe('addDocument', () => {
    it('应该成功添加文档', async () => {
      const createDocumentDto = {
        title: 'Test Document',
        content: 'This is a test document content.',
        source: 'test-source',
      };

      const mockDocument = {
        id: 'test-id',
        ...createDocumentDto,
        isProcessed: false,
        owner: { id: 'user-id' },
      };

      mockDocumentRepository.create.mockReturnValue(mockDocument);
      mockDocumentRepository.save.mockResolvedValue(mockDocument);
      mockLangChainService.processDocument.mockResolvedValue([
        {
          chunk: 'This is a test',
          embedding: [0.1, 0.2, 0.3],
          metadata: { title: 'Test Document', chunkIndex: 0 },
        },
      ]);

      const result = await service.addDocument(createDocumentDto, 'user-id');

      expect(result.id).toBe('test-id');
      expect(mockDocumentRepository.create).toHaveBeenCalled();
      expect(mockDocumentRepository.save).toHaveBeenCalled();
    });
  });

  describe('queryKnowledge', () => {
    it('应该成功查询知识库', async () => {
      const queryDto = {
        query: 'What is JavaScript?',
        topK: 5,
        threshold: 0.5,
      };

      mockLangChainService.generateEmbedding.mockResolvedValue([
        0.1, 0.2, 0.3,
      ]);
      mockMilvusService.searchSimilar.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'JavaScript Basics',
          content: 'JavaScript is a programming language...',
          score: 0.85,
        },
      ]);

      const result = await service.queryKnowledge(queryDto, 'user-id');

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(0.85);
      expect(mockLangChainService.generateEmbedding).toHaveBeenCalledWith(
        queryDto.query
      );
    });
  });

  describe('ragQuery', () => {
    it('应该成功执行 RAG 查询', async () => {
      const queryDto = {
        query: 'What is Python?',
        topK: 3,
      };

      mockLangChainService.generateEmbedding.mockResolvedValue([
        0.1, 0.2, 0.3,
      ]);
      mockMilvusService.searchSimilar.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Python Basics',
          content: 'Python is a high-level programming language...',
          score: 0.9,
        },
      ]);
      mockLangChainService.buildRAGPrompt.mockReturnValue(
        'Based on the documents...'
      );

      const result = await service.ragQuery(queryDto, 'user-id');

      expect(result.query).toBe(queryDto.query);
      expect(result.contexts).toHaveLength(1);
      expect(result.ragPrompt).toBeDefined();
    });
  });

  describe('getUserDocuments', () => {
    it('应该返回用户的所有文档', async () => {
      const mockDocuments = [
        { id: '1', title: 'Doc 1', isProcessed: true },
        { id: '2', title: 'Doc 2', isProcessed: false },
      ];

      mockDocumentRepository.find.mockResolvedValue(mockDocuments);

      const result = await service.getUserDocuments('user-id');

      expect(result).toHaveLength(2);
      expect(mockDocumentRepository.find).toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('应该成功删除文档', async () => {
      const mockDocument = {
        id: 'test-id',
        title: 'Test Document',
        owner: { id: 'user-id' },
      };

      mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
      mockMilvusService.deleteVector.mockResolvedValue(undefined);
      mockDocumentRepository.remove.mockResolvedValue(undefined);

      await service.deleteDocument('test-id', 'user-id');

      expect(mockMilvusService.deleteVector).toHaveBeenCalledWith('test-id');
      expect(mockDocumentRepository.remove).toHaveBeenCalledWith(mockDocument);
    });
  });

  describe('getStatistics', () => {
    it('应该返回知识库统计信息', async () => {
      const mockDocuments = [
        { id: '1', isProcessed: true },
        { id: '2', isProcessed: true },
        { id: '3', isProcessed: false },
      ];

      mockDocumentRepository.find.mockResolvedValue(mockDocuments);

      const result = await service.getStatistics('user-id');

      expect(result.totalDocuments).toBe(3);
      expect(result.processedDocuments).toBe(2);
      expect(result.pendingDocuments).toBe(1);
    });
  });
});