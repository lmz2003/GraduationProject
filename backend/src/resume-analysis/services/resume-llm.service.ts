import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class ResumeLLMService {
  private llm: ChatOpenAI;
  private readonly logger = new Logger(ResumeLLMService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    const baseUrl = this.configService.get<string>('LLM_BASE_URL');
    const modelName = this.configService.get<string>('LLM_MODEL') || 'gpt-3.5-turbo';
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'openai';

    if (!apiKey) {
      this.logger.warn('LLM API Key not configured');
    }

    if (provider === 'siliconflow') {
      this.llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName,
        configuration: {
          baseURL: baseUrl || 'https://api.siliconflow.cn/v1',
        },
        temperature: 0.7,
        maxTokens: 2000,
      });
    } else {
      this.llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName,
        configuration: baseUrl ? { baseURL: baseUrl } : undefined,
        temperature: 0.7,
        maxTokens: 2000,
      });
    }
  }

  /**
   * 生成个人信息优化建议
   */
  async generatePersonalInfoOptimization(currentInfo: any): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const prompt = `分析以下个人信息，并提供改进建议（用中文回答，保持简洁）：

当前信息：
姓名: ${currentInfo?.name || 'N/A'}
邮箱: ${currentInfo?.email || 'N/A'}
电话: ${currentInfo?.phone || 'N/A'}
位置: ${currentInfo?.location || 'N/A'}

请给出2-3条具体的改进建议，格式为列表。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating personal info optimization:', error);
      return '';
    }
  }

  /**
   * 生成工作经验优化建议
   */
  async generateExperienceOptimization(experience: any): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const experienceText = experience
        .map(
          (exp: any) =>
            `公司: ${exp.company}\n职位: ${exp.position}${exp.department ? `\n部门: ${exp.department}` : ''}${exp.departmentResponsibility ? `\n部门职责: ${exp.departmentResponsibility}` : ''}\n描述: ${exp.description}`
        )
        .join('\n\n');

      const prompt = `分析以下工作经验描述，并提供改进建议（用中文回答）：

${experienceText}

请提供以下方面的建议：
1. 如何使用STAR方法改进描述
2. 缺少哪些量化指标
3. 具体的改进示例（给出1-2个）

保持回答简洁，控制在200字以内。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating experience optimization:', error);
      return '';
    }
  }

  /**
   * 生成技能优化建议
   */
  async generateSkillsOptimization(skills: string[]): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const skillsText = skills.join('、');

      const prompt = `分析以下技能列表，并提供改进建议（用中文回答）：

当前技能: ${skillsText}

请提供以下方面的建议：
1. 哪些高价值技能可能缺少
2. 如何按重要性重新排序
3. 是否有过时或低价值的技能应该移除

保持回答简洁，控制在150字以内。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating skills optimization:', error);
      return '';
    }
  }

  /**
   * 对标职位描述并生成建议
   */
  async generateJobMatchAnalysis(
    resumeContent: string,
    jobDescription: string
  ): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const prompt = `作为一名招聘专家，请分析简历与职位描述的匹配度（用中文回答）：

简历内容摘要（前500字）:
${resumeContent.substring(0, 500)}

职位描述:
${jobDescription}

请从以下方面分析（每部分1-2句）：
1. 整体匹配度评分（1-10）
2. 符合的关键要求
3. 缺失的关键能力
4. 如何改进简历以更好地匹配职位

保持回答在300字以内。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating job match analysis:', error);
      return '';
    }
  }

  /**
   * 生成完整的简历评估报告
   */
  async generateDetailedAnalysisReport(
    resumeContent: string,
    parsedData: any,
    basicScores: any
  ): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const prompt = `请作为资深HR和招聘顾问，为以下简历生成一份详细评估报告（用中文回答）：

简历基本信息：
- 总体评分: ${basicScores.overallScore}/100
- 完整性: ${basicScores.completenessScore}/100
- 关键词覆盖: ${basicScores.keywordScore}/100

简历摘要（前400字）:
${resumeContent.substring(0, 400)}

请生成包含以下内容的评估报告：
1. 整体评价（2句）
2. 最突出的3个优势
3. 需要改进的3个方面
4. 针对IT行业的5条具体改进建议

控制字数在400字以内，使用清晰的结构化格式。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating detailed analysis report:', error);
      return '';
    }
  }

  /**
   * 生成简历优势分析
   */
  async generateStrengthsAnalysis(resumeContent: string, resumeType: 'freshman' | 'experienced'): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const prompt = `作为资深HR专家，请分析以下简历并提取3-5个最突出的优势（用中文回答）：

简历类型：${resumeType === 'freshman' ? '校招生' : '社招'}

简历内容（前500字）：
${resumeContent.substring(0, 500)}

请以列表形式返回优势，每个优势用简洁的中文描述，不要添加任何引言或结论。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating strengths analysis:', error);
      return '';
    }
  }

  /**
   * 生成简历劣势分析
   */
  async generateWeaknessesAnalysis(resumeContent: string, resumeType: 'freshman' | 'experienced'): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const prompt = `作为资深HR专家，请分析以下简历并提取3-5个需要改进的方面（用中文回答）：

简历类型：${resumeType === 'freshman' ? '校招生' : '社招'}

简历内容（前500字）：
${resumeContent.substring(0, 500)}

请以列表形式返回劣势，每个劣势用简洁的中文描述，不要添加任何引言或结论。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating weaknesses analysis:', error);
      return '';
    }
  }

  /**
   * 生成简历改进建议
   */
  async generateSuggestionsAnalysis(resumeContent: string, resumeType: 'freshman' | 'experienced'): Promise<string> {
    try {
      if (!this.llm) {
        this.logger.warn('LLM not initialized');
        return '';
      }

      const prompt = `作为资深HR专家，请针对以下简历提供具体的改进建议（用中文回答）：

简历类型：${resumeType === 'freshman' ? '校招生' : '社招'}

简历内容（前500字）：
${resumeContent.substring(0, 500)}

请从以下方面提供建议：
1. 内容结构
2. 工作/实习经验描述
3. 技能展示
4. 格式排版

每个方面提供1-2条具体建议，保持简洁明了。`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      this.logger.error('Error generating suggestions analysis:', error);
      return '';
    }
  }
}
