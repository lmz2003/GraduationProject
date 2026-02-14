import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import PDFParser from 'pdf-parse';
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
      this.logger.log(`[PDF Parser] Starting to parse PDF file: ${filePath}`);
      const fileBuffer = fs.readFileSync(filePath);
      this.logger.log(`[PDF Parser] File buffer size: ${fileBuffer.length} bytes`);
      
      const pdfData = await PDFParser(fileBuffer);
      const text = pdfData.text || '';
      
      this.logger.log(`[PDF Parser] PDF parsed successfully. Total characters: ${text.length}`);
      this.logger.log(`[PDF Parser] Number of pages: ${pdfData.numpages}`);
      this.logger.log(`[PDF Parser] Extracted text preview (first 500 chars):\n${text.substring(0, 500)}`);
      this.logger.log(`[PDF Parser] Full extracted text:\n${text}`);
      
      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[PDF Parser] PDF parsing failed: ${errorMsg}`, error);
      throw new BadRequestException(`PDF parsing failed: ${errorMsg}`);
    }
  }

  /**
   * 解析 DOCX 文件
   */
  async parseDocx(filePath: string): Promise<string> {
    try {
      this.logger.log(`[DOCX Parser] Starting to parse DOCX file: ${filePath}`);
      const fileBuffer = fs.readFileSync(filePath);
      this.logger.log(`[DOCX Parser] File buffer size: ${fileBuffer.length} bytes`);
      
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value;
      
      this.logger.log(`[DOCX Parser] DOCX parsed successfully. Total characters: ${text.length}`);
      this.logger.log(`[DOCX Parser] Extracted text preview (first 500 chars):\n${text.substring(0, 500)}`);
      this.logger.log(`[DOCX Parser] Full extracted text:\n${text}`);
      
      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[DOCX Parser] DOCX parsing failed: ${errorMsg}`, error);
      throw new BadRequestException(`DOCX parsing failed: ${errorMsg}`);
    }
  }

  /**
   * 解析文本文件
   */
  async parseTextFile(filePath: string): Promise<string> {
    try {
      this.logger.log(`[Text Parser] Starting to parse text file: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      this.logger.log(`[Text Parser] Text file parsed successfully. Total characters: ${content.length}`);
      this.logger.log(`[Text Parser] Extracted text preview (first 500 chars):\n${content.substring(0, 500)}`);
      this.logger.log(`[Text Parser] Full extracted text:\n${content}`);
      
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Text Parser] Text file parsing failed: ${errorMsg}`, error);
      throw new BadRequestException(`Text file parsing failed: ${errorMsg}`);
    }
  }

  /**
   * 读取文件的原始二进制数据
   */
  async readFileBinary(filePath: string): Promise<Buffer> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return fileBuffer;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read file binary: ${errorMsg}`, error);
      throw new BadRequestException(`Failed to read file binary: ${errorMsg}`);
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

    // 提取邮箱 - 使用最简单的方法，提取第一个 @xxx.xxx 模式
    const emailMatches = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
      // 取第一个匹配的邮箱，并清理掉可能的尾部垃圾
      let email = emailMatches[0];
      // 如果邮箱后面跟了"https"或其他字母，则只取到com为止
      if (email.match(/\.com[a-z]/i)) {
        email = email.match(/[\w.-]+@[\w.-]+\.com/i)?.[0] || email;
      } else if (email.match(/\.[a-z]{2,}/i)) {
        const match = email.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}(?=\s|$|[^a-z])/i);
        email = match ? match[0] : email;
      }
      personalInfo.email = email;
    }

    // 提取电话号码 (支持多种格式，使用更通用的模式)
    const phoneMatch = text.match(/\b(?:\+?86[-.\s]?)?1[3-9]\d{9}\b/);
    if (phoneMatch) {
      const phone = phoneMatch[0].trim();
      personalInfo.phone = phone;
    }

    // 提取名字（通常在开头）
    const lines = text.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // 名字通常不包含特殊符号和邮箱，且长度合理
      if (firstLine.length > 0 && firstLine.length < 30 && !firstLine.includes('@') && !firstLine.includes('http')) {
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
    
    // 寻找工作经历相关的关键词，使用更精确的分界符
    const workSectionRegex = /(?:Work Experience|工作经验|实习经历|职位经历|Professional Experience|Career|工作履历|ë实习经历)([\s\S]*?)(?=(?:Education|Skills|Projects|语言|Languages|技能|项目|教育|学历|获奖|certification|award|đ项目|教学|$))/i;
    const workMatch = text.match(workSectionRegex);
    
    if (!workMatch) {
      this.logger.debug('[Resume Parser] No work experience section found');
      return experiences;
    }

    const workSection = workMatch[1];
    
    // 使用更严格的分隔逻辑：以公司名称和时间模式开头的行
    const lines = workSection.split('\n').filter(l => l.trim().length > 0);
    
    let currentEntry: any = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测是否是新的工作条目（通常包含日期范围）
      const datePattern = /\d{4}\.\d{1,2}\s*[–-]\s*\d{4}\.\d{1,2}|\d{4}年\d{1,2}月|present|current|至今|now/i;
      
      if (datePattern.test(trimmedLine) && trimmedLine.length < 100) {
        // 这是一条日期行，属于公司/职位行
        if (currentEntry && currentEntry.company) {
          currentEntry.position = trimmedLine.split(/\s{2,}|-/)[0] || 'Unknown Position';
          // 从日期行提取日期
          const dateMatch = trimmedLine.match(/(\d{4}\.\d{1,2})\s*[–-]\s*(\d{4}\.\d{1,2})/);
          if (dateMatch) {
            currentEntry.startDate = dateMatch[1];
            currentEntry.endDate = dateMatch[2];
          }
        }
      } else if (trimmedLine.length > 5 && trimmedLine.length < 60 && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        // 这可能是公司名称行
        if (currentEntry && currentEntry.company) {
          // 保存前一个条目
          experiences.push(currentEntry);
        }
        currentEntry = {
          company: trimmedLine,
          position: 'Unknown Position',
          startDate: 'N/A',
          endDate: 'N/A',
          description: '',
        };
      } else if (currentEntry && (trimmedLine.startsWith('•') || trimmedLine.startsWith('-'))) {
        // 这是描述行
        currentEntry.description = (currentEntry.description + ' ' + trimmedLine.substring(1)).trim();
      }
    }
    
    // 不要忘记最后一个条目
    if (currentEntry && currentEntry.company) {
      experiences.push(currentEntry);
    }

    return experiences;
  }

  /**
   * 提取技能
   */
  private extractSkills(text: string): string[] {
    const skills: string[] = [];
    
    // 更灵活的正则表达式，匹配"专业技能"、"Ð专业技能"等变体
    const skillsSectionRegex = /(?:Skills|技能|Technical Skills|Expertise|专业技能|Ð专业技能|ð专业技能)([\s\S]*?)(?=(?:Experience|Projects|Education|Languages|工作经验|项目|教育|语言|实习|职位|Career|ë实习经历|đ项目|ô|获奖|award|certification|$))/i;
    const skillsMatch = text.match(skillsSectionRegex);

    if (!skillsMatch) {
      this.logger.debug('[Resume Parser] No skills section found');
      return skills;
    }

    const skillsSection = skillsMatch[1];
    this.logger.debug(`[Resume Parser] Skills section found, length: ${skillsSection.length}`);
    
    // 按照主要项点（以•或其他符号+冒号格式）来分割
    // 例如："•语言基础：..." 或 "• 框架生态：..."
    const skillCategories = skillsSection.split(/•/).filter(s => s.trim().length > 0);
    
    for (const category of skillCategories) {
      const categoryTrimmed = category.trim();
      
      // 检测是否有冒号（表示这是一个分类）
      if (categoryTrimmed.includes('：') || categoryTrimmed.includes(':')) {
        // 提取冒号后的部分
        const colonIndex = Math.max(
          categoryTrimmed.indexOf('：'),
          categoryTrimmed.indexOf(':')
        );
        const skillContent = categoryTrimmed.substring(colonIndex + 1).trim();
        
        // 从描述性文本中尽可能提取关键技能/工具
        // 按照第一句或技能特征来分割
        const sentences = skillContent.split(/[。，、；;\n]/);
        
        for (const sentence of sentences) {
          const sentenceTrimmed = sentence.trim();
          
          if (sentenceTrimmed.length === 0 || sentenceTrimmed.length > 100) continue;
          
          // 尽量从第一句提取关键技能
          // 例如 "拥有扎实的HTML、CSS、JavaScript、TypeScript基础" -> 提取 HTML, CSS, JavaScript, TypeScript
          if (sentenceTrimmed.includes('HTML') || sentenceTrimmed.includes('CSS') || 
              sentenceTrimmed.includes('JavaScript') || sentenceTrimmed.includes('TypeScript')) {
            // 从这类特定列表中提取
            const techSkills = sentenceTrimmed.match(/[A-Za-z]+(\s+[A-Za-z]+)?/g) || [];
            skills.push(...techSkills.filter(s => s.length > 1 && s.length < 30));
          } else if (sentenceTrimmed.match(/React|Vue|Angular|Node|Express|Webpack|Vite|Python|Java|Go|Rust/)) {
            // 提取技术栈关键词
            const matches = sentenceTrimmed.match(/React|Vue|Angular|Node|Express|Webpack|Vite|Python|Java|Go|Rust|MongoDB|MySQL|PostgreSQL|Docker|Kubernetes|Git|GraphQL/g);
            if (matches) skills.push(...matches);
          }
        }
      } else {
        // 没有冒号，直接是简短的技能列表
        const skillItems = categoryTrimmed
          .split(/[,，、；;\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 1 && s.length < 50);
        skills.push(...skillItems);
      }
    }
    
    // 添加一些基于关键词的技能识别
    const keywordSkills = {
      'HTML': /(html|web|页面)/i,
      'CSS': /(css|样式|布局)/i,
      'JavaScript': /(javascript|js|escript)/i,
      'TypeScript': /(typescript|ts)/i,
      'React': /react/i,
      'Vue': /vue/i,
      'Node.js': /node|nodejs/i,
      'Express': /express/i,
      'MongoDB': /mongodb/i,
      'MySQL': /mysql/i,
      'PostgreSQL': /postgresql/i,
      'Docker': /docker/i,
      'Webpack': /webpack/i,
      'Vite': /vite/i,
      'Git': /git/i,
      'Zustand': /zustand/i,
      'Redux': /redux/i,
      'Ant Design': /ant\s*design|antd/i,
      'Element Plus': /element\s*plus/i,
    };
    
    for (const [skillName, pattern] of Object.entries(keywordSkills)) {
      if (pattern.test(skillsSection)) {
        skills.push(skillName);
      }
    }
    
    // 去重和过滤
    const uniqueSkills = Array.from(new Set(skills))
      .filter(s => s.length > 0 && s.length < 50)
      .slice(0, 40); // 最多返回40个技能

    return uniqueSkills;
  }

  /**
   * 提取教育背景
   */
  private extractEducation(text: string): ParsedResume['education'] {
    const education: ParsedResume['education'] = [];
    
    // 更灵活的正则表达式，匹配各种教育部分的标题
    const eduSectionRegex = /(?:Education|教育|学历|Academic Background|教育经历|ŵ教育经历)([\s\S]*?)(?=(?:Skills|Experience|Projects|技能|工作经验|项目|Professional|Ð专业|实习|ë实习|$))/i;
    const eduMatch = text.match(eduSectionRegex);

    if (!eduMatch) {
      this.logger.debug('[Resume Parser] No education section found');
      return education;
    }

    const eduSection = eduMatch[1];
    const lines = eduSection.split('\n').filter(l => l.trim().length > 0);

    let currentEntry: any = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测日期模式（如2022.08 – 2026.06）
      const datePattern = /\d{4}\.\d{1,2}\s*[–-]\s*\d{4}\.\d{1,2}|\d{4}年\d{1,2}月/;
      
      if (datePattern.test(trimmedLine) && trimmedLine.length < 100) {
        // 这是日期行，属于学校名称或学位信息
        if (currentEntry && currentEntry.school) {
          // 提取日期
          const dateMatch = trimmedLine.match(/(\d{4})\.(\d{1,2})\s*[–-]\s*(\d{4})\.(\d{1,2})/);
          if (dateMatch) {
            currentEntry.graduationDate = `${dateMatch[3]}-${dateMatch[4]}`;
          }
        }
      } else if (trimmedLine.length > 3 && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        // 这可能是学校名称或学位/专业
        
        // 检测是否是学位/专业行（通常包含"本科"、"硕士"、"专科"等关键词）
        const degreePattern = /本科|硕士|博士|专科|学士|Master|Bachelor|PhD|Associate/i;
        
        if (degreePattern.test(trimmedLine)) {
          // 这是学位/专业/成绩行
          if (currentEntry && currentEntry.school && !currentEntry.degree) {
            currentEntry.degree = trimmedLine;
          } else if (currentEntry && currentEntry.school && !currentEntry.field) {
            currentEntry.field = trimmedLine;
          }
        } else if (!currentEntry || currentEntry.school) {
          // 这是新的学校记录
          if (currentEntry && currentEntry.school) {
            education.push(currentEntry);
          }
          currentEntry = {
            school: trimmedLine,
            degree: 'N/A',
            field: 'N/A',
            graduationDate: 'N/A',
          };
        }
      }
    }
    
    // 不要忘记最后一个条目
    if (currentEntry && currentEntry.school) {
      education.push(currentEntry);
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

    this.logger.log(`[Resume Parser] Starting to parse resume content (${text.length} characters)`);

    const parsedData: ParsedResume = {
      personalInfo: this.extractPersonalInfo(text),
      workExperience: this.extractWorkExperience(text),
      skills: this.extractSkills(text),
      education: this.extractEducation(text),
    };

    // 详细日志输出
    this.logger.log(`[Resume Parser] ========== PARSING RESULT ==========`);
    
    this.logger.log(`[Resume Parser] Personal Info:`, JSON.stringify(parsedData.personalInfo, null, 2));
    
    this.logger.log(`[Resume Parser] Skills (${parsedData.skills?.length || 0} total):`, 
      JSON.stringify(parsedData.skills, null, 2));
    
    this.logger.log(`[Resume Parser] Education (${parsedData.education?.length || 0} total):`, 
      JSON.stringify(parsedData.education, null, 2));
    
    this.logger.log(`[Resume Parser] Work Experience (${parsedData.workExperience?.length || 0} total):`, 
      JSON.stringify(parsedData.workExperience, null, 2));
    
    this.logger.log(`[Resume Parser] ====================================`);

    return parsedData;
  }
}
