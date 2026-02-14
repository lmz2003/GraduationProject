import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as PDFParser from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

interface ParsedResume {
  personalInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    location?: string;
    portfolio?: string;
  };
  professionalSummary?: string;
  workExperience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  [key: string]: any;
}

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  /**
   * 解析 PDF 文件
   */
  async parsePDF(filePath: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await PDFParser(fileBuffer);
      const text = pdfData.text || '';
      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PDF parsing failed: ${errorMsg}`, error);
      throw new BadRequestException(`PDF parsing failed: ${errorMsg}`);
    }
  }

  /**
   * 解析 DOCX 文件
   */
  async parseDocx(filePath: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`DOCX parsing failed: ${errorMsg}`, error);
      throw new BadRequestException(`DOCX parsing failed: ${errorMsg}`);
    }
  }

  /**
   * 解析文本文件
   */
  async parseTextFile(filePath: string): Promise<string> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Text file parsing failed: ${errorMsg}`, error);
      throw new BadRequestException(`Text file parsing failed: ${errorMsg}`);
    }
  }

  /**
   * 根据文件类型解析简历
   */
  async parseResumeFile(filePath: string, fileType: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    switch (fileType.toLowerCase()) {
      case 'pdf':
      case '.pdf':
        return this.parsePDF(filePath);
      case 'docx':
      case '.docx':
        return this.parseDocx(filePath);
      case 'doc':
      case '.doc':
        // Word 格式统一使用 mammoth 解析
        return this.parseDocx(filePath);
      case 'txt':
      case '.txt':
        return this.parseTextFile(filePath);
      default:
        throw new BadRequestException(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * 提取个人信息
   */
  private extractPersonalInfo(text: string): ParsedResume['personalInfo'] {
    const personalInfo: ParsedResume['personalInfo'] = {};

    // 提取邮箱
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    // 提取电话号码 (支持多种格式)
    const phoneMatch = text.match(/(\+?86[-.\s]?)?1[3-9]\d{9}|(\+?1[-.\s]?)?(\d{3}[-.\s]?){2}\d{4}/);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // 提取名字（通常在开头）
    const lines = text.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 0 && firstLine.length < 30 && !firstLine.includes('@')) {
        personalInfo.name = firstLine;
      }
    }

    return personalInfo;
  }

  /**
   * 提取工作经验
   */
  private extractWorkExperience(text: string): ParsedResume['workExperience'] {
    const experiences: ParsedResume['workExperience'] = [];
    
    // 寻找工作经历相关的关键词
    const workSectionRegex = /(?:Work Experience|工作经验|职位经历|Professional Experience|Career|工作履历)([\s\S]*?)(?=(?:Education|Skills|Projects|语言|Languages|技能|项目|教育|学历|$))/i;
    const workMatch = text.match(workSectionRegex);
    
    if (!workMatch) return experiences;

    const workSection = workMatch[1];
    
    // 分割各个工作经验条目
    const entryRegex = /[\n\r]{2,}(?=\S)/g;
    const entries = workSection.split(entryRegex).filter(e => e.trim().length > 0);

    for (const entry of entries) {
      const lines = entry.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        experiences.push({
          company: lines[0] || 'Unknown',
          position: lines[1] || 'Unknown Position',
          startDate: 'N/A',
          endDate: 'N/A',
          description: lines.slice(2).join(' '),
        });
      }
    }

    return experiences;
  }

  /**
   * 提取技能
   */
  private extractSkills(text: string): string[] {
    const skills: string[] = [];
    
    const skillsSectionRegex = /(?:Skills|技能|Technical Skills|Expertise)([\s\S]*?)(?=(?:Experience|Projects|Education|Languages|工作经验|项目|教育|语言|$))/i;
    const skillsMatch = text.match(skillsSectionRegex);

    if (!skillsMatch) return skills;

    const skillsSection = skillsMatch[1];
    
    // 分割技能（可能用逗号、分号或其他方式分隔）
    const skillList = skillsSection
      .split(/[,;•\n-]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50);

    return skillList.slice(0, 20); // 最多返回20个技能
  }

  /**
   * 提取教育背景
   */
  private extractEducation(text: string): ParsedResume['education'] {
    const education: ParsedResume['education'] = [];
    
    const eduSectionRegex = /(?:Education|教育|学历|Academic Background)([\s\S]*?)(?=(?:Skills|Experience|Projects|技能|工作经验|项目|$))/i;
    const eduMatch = text.match(eduSectionRegex);

    if (!eduMatch) return education;

    const eduSection = eduMatch[1];
    const lines = eduSection.split('\n').filter(l => l.trim().length > 0);

    for (let i = 0; i < lines.length; i++) {
      if (i + 1 < lines.length) {
        education.push({
          school: lines[i],
          degree: lines[i + 1],
          field: 'N/A',
          graduationDate: 'N/A',
        });
        i++;
      }
    }

    return education;
  }

  /**
   * 使用结构化方式解析简历内容
   */
  async parseResumeContent(text: string): Promise<ParsedResume> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Resume content is empty');
    }

    const parsedData: ParsedResume = {
      personalInfo: this.extractPersonalInfo(text),
      workExperience: this.extractWorkExperience(text),
      skills: this.extractSkills(text),
      education: this.extractEducation(text),
    };

    return parsedData;
  }
}
