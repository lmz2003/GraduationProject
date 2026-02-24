import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as validateUUID } from 'uuid';
import { Resume } from '../entities/resume.entity';
import { ResumeAnalysis } from '../entities/resume-analysis.entity';
import { ResumeParserService } from './resume-parser.service';
import { ResumeAnalyzerService } from './resume-analyzer.service';
import { ResumeLLMService } from './resume-llm.service';
import { UploadResumeDto } from '../dto/upload-resume.dto';

@Injectable()
export class ResumeAnalysisService {
  private readonly logger = new Logger(ResumeAnalysisService.name);

  constructor(
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(ResumeAnalysis)
    private analysisRepository: Repository<ResumeAnalysis>,
    private parserService: ResumeParserService,
    private analyzerService: ResumeAnalyzerService,
    private llmService: ResumeLLMService
  ) {}

  /**
   * 上传简历（文本）
   */
  async uploadResume(
    dto: UploadResumeDto,
    userId: string
  ): Promise<Resume> {
    try {
      const resume = this.resumeRepository.create({
        title: dto.title,
        content: dto.content || '',
        jobDescription: dto.jobDescription || undefined,
        fileType: 'txt',
        ownerId: userId,
        isProcessed: false,
        status: 'active',
      });

      const savedResume = await this.resumeRepository.save(resume);

      // 异步处理解析和分析
      this.processResumeAsync(savedResume.id, userId).catch((error) => {
        this.logger.error(`Error processing resume ${savedResume.id}:`, error);
      });

      return savedResume;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to upload resume:', error);
      throw new BadRequestException(`Failed to upload resume: ${errorMsg}`);
    }
  }

  /**
   * 上传简历（文件）
   */
  async uploadResumeFile(
    title: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    fileSize: number,
    userId: string,
    jobDescription?: string
  ): Promise<Resume> {
    try {
      // 解析文件内容
      const content = await this.parserService.parseResumeBuffer(fileBuffer, fileType);

      const resume = this.resumeRepository.create({
        title,
        content,
        jobDescription: jobDescription || undefined,
        fileBinary: fileBuffer,
        fileName,
        fileType: fileType.toLowerCase().replace(/^\./, ''),
        fileSize,
        ownerId: userId,
        isProcessed: false,
        status: 'active',
      });

      const savedResume = await this.resumeRepository.save(resume);

      // 异步处理解析和分析
      this.processResumeAsync(savedResume.id, userId).catch((error) => {
        this.logger.error(`Error processing resume ${savedResume.id}:`, error);
      });

      return savedResume;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to upload resume file:', error);
      throw new BadRequestException(`Failed to upload resume: ${errorMsg}`);
    }
  }

  /**
   * 异步处理简历（解析和分析）
   */
  private async processResumeAsync(resumeId: string, userId: string): Promise<void> {
    try {
      const resume = await this.resumeRepository.findOne({ where: { id: resumeId } });
      if (!resume) {
        this.logger.warn(`Resume not found: ${resumeId}`);
        return;
      }

      // 1. 解析简历内容 - 使用 LLM
      const parsedData = await this.parserService.parseResumeContent(resume.content);

      // 2. 更新解析数据
      resume.parsedData = parsedData;
      await this.resumeRepository.save(resume);

      // 3. 执行分析
      const analysisResult = await this.analyzerService.analyzeResume(
        resume.content,
        parsedData
      );

      // 4. 保存分析结果（✨ 支持简历类型）
      const analysis = this.analysisRepository.create({
        resumeId,
        overallScore: analysisResult.overallScore,
        completenessScore: analysisResult.completenessScore,
        keywordScore: analysisResult.keywordScore,
        formatScore: analysisResult.formatScore,
        experienceScore: analysisResult.experienceScore,
        skillsScore: analysisResult.skillsScore,
        strengths: JSON.stringify(analysisResult.strengths),
        weaknesses: JSON.stringify(analysisResult.weaknesses),
        suggestions: JSON.stringify(analysisResult.suggestions),
        keywordAnalysis: JSON.stringify(analysisResult.keywordAnalysis),
        structureAnalysis: JSON.stringify(analysisResult.structureAnalysis),
        contentAnalysis: JSON.stringify(analysisResult.contentAnalysis),
      });

      await this.analysisRepository.save(analysis);

      // 5. 异步调用 LLM 生成更详细的建议（✨ 传递简历类型）
      this.generateLLMSuggestionsAsync(
        analysis.id,
        resume,
        parsedData,
        analysisResult,
        analysisResult.resumeType || 'freshman'  // ✨ 使用识别的简历类型
      ).catch(
        (error) => {
          this.logger.error(`Error generating LLM suggestions for analysis ${analysis.id}:`, error);
        }
      );

      // 更新简历状态
      resume.isProcessed = true;
      await this.resumeRepository.save(resume);

      this.logger.log(`Resume processed successfully: ${resumeId}`);
    } catch (error) {
      this.logger.error(`Error processing resume ${resumeId}:`, error);
    }
  }

  /**
   * 异步生成 LLM 建议（✨ 优化：根据简历类型生成针对性的建议）
   */
  private async generateLLMSuggestionsAsync(
    analysisId: string,
    resume: Resume,
    parsedData: any,
    analysisResult: any,
    resumeType: 'freshman' | 'experienced'
  ): Promise<void> {
    try {
      const analysis = await this.analysisRepository.findOne({ where: { id: analysisId } });
      if (!analysis) return;

      // ✨ 根据简历类型生成针对性的建议
      const [personalInfoOpt, experienceOpt, skillsOpt, detailedReport] = await Promise.all([
        this.llmService.generatePersonalInfoOptimization(parsedData.personalInfo),
        
        // 校招 vs 社招差异化处理
        resumeType === 'freshman'
          ? (parsedData.internshipExperience && parsedData.internshipExperience.length > 0
              ? this.llmService.generateExperienceOptimization(parsedData.internshipExperience)
              : Promise.resolve(''))
          : (parsedData.workExperience && parsedData.workExperience.length > 0
              ? this.llmService.generateExperienceOptimization(parsedData.workExperience)
              : Promise.resolve('')),
        
        parsedData.skills && parsedData.skills.length > 0
          ? this.llmService.generateSkillsOptimization(parsedData.skills)
          : Promise.resolve(''),
        
        // 生成针对性的详细报告
        this.llmService.generateDetailedAnalysisReport(resume.content, parsedData, analysisResult),
      ]);

      // 更新分析结果
      analysis.personalInfoSuggestions = {
        suggestion: personalInfoOpt,
      };

      if (experienceOpt) {
        analysis.experienceSuggestions = [
          {
            suggestion: experienceOpt,
          },
        ];
      }

      // 将详细报告和其他建议添加到 suggestions 中
      const suggestions = JSON.parse(analysis.suggestions || '{}');
      suggestions.detailedReport = detailedReport;
      
      // ✨ 添加简历类型信息到建议中
      suggestions.resumeType = resumeType;
      
      // ✨ 根据简历类型添加针对性的优化建议
      if (resumeType === 'freshman') {
        suggestions.freshmanSpecificTips = {
          education: '教育背景是校招简历的核心，确保突出学校、学位和GPA（如果优秀）',
          internship: '实习经历展示了职场适应能力，建议补充2-3段高质量实习',
          projects: '项目经验和毕设是展示技能的关键，要突出技术深度和创新性',
          campus: '校园活动展示领导力，建议补充学生会或社团等组织经验',
          skills: '技能列表要与应聘岗位相关，突出核心技术栈'
        };
      } else {
        suggestions.experiencedSpecificTips = {
          professionalSummary: '职业总结要清晰表达职业定位和核心竞争力',
          workExperience: '用数据和具体案例展示商业价值，突出成就而非职责',
          management: '如有管理经验，要明确说明团队规模和管理成果',
          skills: '技能要与职业等级匹配，标注掌握深度，优化关键词',
          projects: '项目描述要体现商业影响力和你的核心贡献'
        };
      }
      
      if (skillsOpt) {
        suggestions.skillsOptimization = skillsOpt;
      }
      
      analysis.suggestions = JSON.stringify(suggestions);

      await this.analysisRepository.save(analysis);

      this.logger.log(`LLM suggestions generated for analysis: ${analysisId} (resumeType: ${resumeType})`);
    } catch (error) {
      this.logger.error(`Error in generateLLMSuggestionsAsync:`, error);
    }
  }

  /**
   * 获取用户的所有简历
   */
  async getResumesByUserId(userId: string): Promise<Resume[]> {
    return this.resumeRepository.find({
      where: { ownerId: userId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取简历详情
   */
  async getResumeById(id: string, userId: string): Promise<Resume> {
    // 验证 ID 是否为有效的 UUID
    if (!validateUUID(id)) {
      throw new BadRequestException('Invalid resume ID format');
    }

    const resume = await this.resumeRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  /**
   * 获取简历分析结果
   */
  async getResumeAnalysis(resumeId: string, userId: string): Promise<ResumeAnalysis> {
    // 验证 ID 是否为有效的 UUID
    if (!validateUUID(resumeId)) {
      throw new BadRequestException('Invalid resume ID format');
    }

    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId, ownerId: userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const analysis = await this.analysisRepository.findOne({
      where: { resumeId },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found. Resume may still be processing.');
    }

    return analysis;
  }

  /**
   * 更新简历
   */
  async updateResume(id: string, userId: string, title: string, content: string): Promise<Resume> {
    // 验证 ID 是否为有效的 UUID
    if (!validateUUID(id)) {
      throw new BadRequestException('Invalid resume ID format');
    }

    const resume = await this.resumeRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    resume.title = title;
    resume.content = content;
    resume.isProcessed = false;

    const updated = await this.resumeRepository.save(resume);

    // 异步重新处理
    this.processResumeAsync(id, userId).catch((error) => {
      this.logger.error(`Error reprocessing resume ${id}:`, error);
    });

    return updated;
  }

  /**
   * 删除简历
   */
  async deleteResume(id: string, userId: string): Promise<void> {
    // 验证 ID 是否为有效的 UUID
    if (!validateUUID(id)) {
      throw new BadRequestException('Invalid resume ID format');
    }

    const resume = await this.resumeRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // 逻辑删除
    resume.status = 'deleted';
    await this.resumeRepository.save(resume);
  }

  /**
   * 对标职位描述
   */
  async compareWithJobDescription(
    resumeId: string,
    userId: string,
    jobDescription: string
  ): Promise<string> {
    // 验证 ID 是否为有效的 UUID
    if (!validateUUID(resumeId)) {
      throw new BadRequestException('Invalid resume ID format');
    }

    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId, ownerId: userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const matchAnalysis = await this.llmService.generateJobMatchAnalysis(
      resume.content,
      jobDescription
    );

    return matchAnalysis;
  }
}
