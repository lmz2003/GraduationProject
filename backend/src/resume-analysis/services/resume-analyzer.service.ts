import { Injectable, Logger } from '@nestjs/common';

interface AnalysisResult {
  overallScore: number;
  completenessScore: number;
  keywordScore: number;
  formatScore: number;
  experienceScore: number;
  skillsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: {
    [key: string]: string;
  };
  keywordAnalysis: {
    [key: string]: number;
  };
  structureAnalysis: {
    issues: string[];
    suggestions: string[];
  };
  contentAnalysis: {
    totalWords: number;
    sections: {
      [key: string]: number;
    };
  };
}

@Injectable()
export class ResumeAnalyzerService {
  private readonly logger = new Logger(ResumeAnalyzerService.name);

  private readonly commonKeywords = {
    // 技能关键词
    skills: [
      'javascript', 'typescript', 'python', 'java', 'c++', 'go', 'rust', 'kotlin',
      'react', 'vue', 'angular', 'svelte', 'nodejs', 'express', 'fastapi', 'django',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'docker', 'kubernetes', 'aws', 'gcp', 'azure',
      'git', 'ci/cd', 'agile', 'scrum', 'rest', 'graphql', 'grpc',
      'html', 'css', 'webpack', 'vite', 'jest', 'testing',
      'sql', 'nosql', 'orm', 'microservices', 'distributed',
      'machine learning', 'ai', 'deep learning', 'nlp', 'computer vision',
      'solidity', 'ethereum', 'blockchain', 'web3',
      'mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native',
    ],
    // 经验关键词
    experience: [
      'lead', 'architect', 'senior', 'principal', 'staff', 'tech lead',
      'manage', 'mentor', 'team', 'project', 'initiative',
      'improve', 'optimize', 'reduce', 'increase', 'scale',
      'design', 'implement', 'develop', 'build', 'create',
      'analyze', 'research', 'discover', 'identify',
      '年', '个月', 'year', 'month', 'experience',
    ],
    // 教育关键词
    education: [
      'bachelor', 'master', 'phd', 'degree', 'diploma',
      'university', 'college', 'school', 'institute',
      'gpa', 'coursework', 'honors', 'dean',
      '学士', '硕士', '博士', '大学', '学院', 'gpa',
    ],
  };

  /**
   * 计算完整性评分
   */
  private calculateCompletenessScore(parsedData: any): number {
    let score = 0;
    let components = 0;

    // 检查基本部分
    const sections = [
      { name: 'personalInfo', weight: 15 },
      { name: 'workExperience', weight: 25 },
      { name: 'education', weight: 15 },
      { name: 'skills', weight: 20 },
    ];

    for (const section of sections) {
      components += section.weight;
      if (parsedData[section.name] && this.isNonEmpty(parsedData[section.name])) {
        score += section.weight;
      }
    }

    // 考虑项目和证书
    if (parsedData.projects && parsedData.projects.length > 0) {
      score += 10;
      components += 10;
    }
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      score += 10;
      components += 10;
    }

    return components > 0 ? Math.round((score / components) * 100) : 0;
  }

  /**
   * 计算关键词评分
   */
  private calculateKeywordScore(text: string): { score: number; keywords: { [key: string]: number } } {
    const textLower = text.toLowerCase();
    const foundKeywords: { [key: string]: number } = {};
    let score = 0;

    for (const category in this.commonKeywords) {
      for (const keyword of (this.commonKeywords as any)[category]) {
        if (textLower.includes(keyword.toLowerCase())) {
          foundKeywords[keyword] = (foundKeywords[keyword] || 0) + 1;
          score += 2;
        }
      }
    }

    // 标准化评分到 0-100
    score = Math.min(100, Math.round(score * 2.5));

    return { score, keywords: foundKeywords };
  }

  /**
   * 计算格式规范性评分
   */
  private calculateFormatScore(text: string, parsedData: any): number {
    let score = 70; // 基础分

    // 检查长度合理性（简历通常 1-3 页）
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 200 || wordCount > 1500) {
      score -= 10;
    }

    // 检查结构性
    const hasGoodStructure =
      (parsedData.personalInfo && this.isNonEmpty(parsedData.personalInfo)) &&
      (parsedData.workExperience && parsedData.workExperience.length > 0) &&
      (parsedData.education && parsedData.education.length > 0) &&
      (parsedData.skills && parsedData.skills.length > 0);

    if (!hasGoodStructure) {
      score -= 15;
    }

    // 检查是否有重复内容
    const lines = text.split('\n');
    const uniqueLines = new Set(lines);
    if (lines.length > 0 && uniqueLines.size / lines.length < 0.7) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算工作经验评分
   */
  private calculateExperienceScore(workExperience: any): number {
    if (!workExperience || workExperience.length === 0) {
      return 0;
    }

    let score = 30; // 基础分

    // 按工作经验数量加分
    score += Math.min(40, workExperience.length * 10);

    // 检查描述质量
    const totalDescLength = workExperience.reduce(
      (sum: number, exp: any) => sum + (exp.description ? exp.description.length : 0),
      0
    );

    if (totalDescLength > 300) {
      score += 20;
    } else if (totalDescLength > 100) {
      score += 10;
    }

    // 检查是否包含量化成果
    const hasMetrics = workExperience.some((exp: any) =>
      exp.description && /(\d+%|\$\d+|\d+x|增长|提升|优化)/.test(exp.description)
    );

    if (hasMetrics) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * 计算技能评分
   */
  private calculateSkillsScore(skills: string[]): number {
    if (!skills || skills.length === 0) {
      return 0;
    }

    let score = 20; // 基础分

    // 按技能数量加分
    score += Math.min(50, skills.length * 3);

    // 检查技能的多样性
    const uniqueSkills = new Set(skills.map(s => s.toLowerCase()));
    const diversity = uniqueSkills.size / Math.max(1, skills.length);

    if (diversity > 0.8) {
      score += 20;
    } else if (diversity > 0.6) {
      score += 10;
    }

    // 检查是否包含常见的高价值技能
    const hasHighValueSkills = skills.some(skill => {
      const skillLower = skill.toLowerCase();
      return skillLower.includes('python') || skillLower.includes('javascript') || 
             skillLower.includes('react') || skillLower.includes('docker') ||
             skillLower.includes('kubernetes') || skillLower.includes('aws');
    });

    if (hasHighValueSkills) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * 生成优势分析
   */
  private generateStrengths(parsedData: any, scores: any): string[] {
    const strengths: string[] = [];

    if (scores.completenessScore > 75) {
      strengths.push('简历结构完整，包含了所有关键部分');
    }

    if (parsedData.workExperience && parsedData.workExperience.length >= 3) {
      strengths.push('工作经验丰富，展示了职业发展轨迹');
    }

    if (scores.skillsScore > 70) {
      strengths.push('技能列表全面，覆盖多个技术领域');
    }

    if (parsedData.projects && parsedData.projects.length > 0) {
      strengths.push('项目经验部分展示了实战能力');
    }

    if (scores.keywordScore > 60) {
      strengths.push('包含了多个行业认可的技术关键词');
    }

    if (parsedData.education && parsedData.education.length > 0) {
      strengths.push('教育背景清晰，展示了学习轨迹');
    }

    // 如果没有发现特殊优势，给出通用反馈
    if (strengths.length === 0) {
      strengths.push('简历包含了基本的职业信息');
    }

    return strengths;
  }

  /**
   * 生成劣势分析
   */
  private generateWeaknesses(parsedData: any, scores: any, text: string): string[] {
    const weaknesses: string[] = [];

    if (scores.completenessScore < 60) {
      weaknesses.push('简历结构不够完整，缺少某些关键部分');
    }

    if (!parsedData.workExperience || parsedData.workExperience.length === 0) {
      weaknesses.push('缺少工作经验描述，无法展示职业能力');
    } else if (parsedData.workExperience.length < 2) {
      weaknesses.push('工作经验偏少，考虑补充更多职业历程');
    }

    if (!parsedData.skills || parsedData.skills.length < 5) {
      weaknesses.push('技能列表不够详细，建议补充更多具体技能');
    }

    if (scores.keywordScore < 50) {
      weaknesses.push('缺少行业关键词，可能影响搜索排名');
    }

    if (!parsedData.education || parsedData.education.length === 0) {
      weaknesses.push('缺少教育背景信息，建议补充学历信息');
    }

    if (!parsedData.projects || parsedData.projects.length === 0) {
      weaknesses.push('缺少项目经验，建议添加典型项目案例');
    }

    // 检查格式问题
    const lines = text.split('\n');
    if (lines.length > 100) {
      weaknesses.push('内容过长，建议精简到1-2页');
    }

    if (weaknesses.length === 0) {
      weaknesses.push('暂未发现明显缺陷');
    }

    return weaknesses;
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(parsedData: any, scores: any): { [key: string]: string } {
    const suggestions: { [key: string]: string } = {};

    // 个人信息建议
    if (!parsedData.personalInfo || !parsedData.personalInfo.name) {
      suggestions['personalInfo'] =
        '添加清晰的个人信息部分，包括姓名、联系方式和职业头衔（如有）';
    }

    // 专业总结建议
    if (!parsedData.professionalSummary) {
      suggestions['summary'] =
        '添加2-3句的专业总结，概括你的职业背景、核心能力和职业目标';
    }

    // 工作经验建议
    if (!parsedData.workExperience || parsedData.workExperience.length === 0) {
      suggestions['experience'] = '详细描述工作经验，使用STAR方法（情境、任务、行动、结果）突出成就';
    } else {
      suggestions['experience'] = '使用量化指标和具体成果来描述工作成就，如"提高40%的性能"或"管理5人团队"';
    }

    // 技能建议
    if (!parsedData.skills || parsedData.skills.length < 10) {
      suggestions['skills'] = '补充更多技能，按照重要性和相关性排序，重点突出核心竞争力';
    }

    // 教育建议
    if (!parsedData.education || parsedData.education.length === 0) {
      suggestions['education'] = '添加教育背景，包括学校、专业、学位和毕业时间';
    }

    // 项目建议
    if (!parsedData.projects || parsedData.projects.length === 0) {
      suggestions['projects'] = '添加1-3个代表性项目，说明项目背景、你的职责和技术栈';
    }

    // 格式建议
    suggestions['format'] = '确保简历使用一致的字体和格式，避免过多颜色和特殊符号';

    return suggestions;
  }

  /**
   * 主分析方法
   */
  async analyzeResume(text: string, parsedData: any): Promise<AnalysisResult> {
    const scores = {
      completenessScore: this.calculateCompletenessScore(parsedData),
      keywordScoreData: this.calculateKeywordScore(text),
      formatScore: this.calculateFormatScore(text, parsedData),
      experienceScore: this.calculateExperienceScore(parsedData.workExperience),
      skillsScore: this.calculateSkillsScore(parsedData.skills),
    };

    // 计算总体评分（加权平均）
    const overallScore = Math.round(
      scores.completenessScore * 0.2 +
      scores.keywordScoreData.score * 0.2 +
      scores.formatScore * 0.15 +
      scores.experienceScore * 0.25 +
      scores.skillsScore * 0.2
    );

    const strengths = this.generateStrengths(parsedData, scores);
    const weaknesses = this.generateWeaknesses(parsedData, scores, text);
    const suggestions = this.generateSuggestions(parsedData, scores);

    const contentAnalysis = this.analyzeContent(text, parsedData);

    return {
      overallScore,
      completenessScore: scores.completenessScore,
      keywordScore: scores.keywordScoreData.score,
      formatScore: scores.formatScore,
      experienceScore: scores.experienceScore,
      skillsScore: scores.skillsScore,
      strengths,
      weaknesses,
      suggestions,
      keywordAnalysis: scores.keywordScoreData.keywords,
      structureAnalysis: {
        issues: [],
        suggestions: [],
      },
      contentAnalysis,
    };
  }

  /**
   * 内容分析
   */
  private analyzeContent(text: string, parsedData: any): {
    totalWords: number;
    sections: { [key: string]: number };
  } {
    const words = text.split(/\s+/).length;
    const sections: { [key: string]: number } = {
      personalInfo: parsedData.personalInfo ? 1 : 0,
      workExperience: parsedData.workExperience ? parsedData.workExperience.length : 0,
      education: parsedData.education ? parsedData.education.length : 0,
      skills: parsedData.skills ? parsedData.skills.length : 0,
      projects: parsedData.projects ? parsedData.projects.length : 0,
      certifications: parsedData.certifications ? parsedData.certifications.length : 0,
    };

    return {
      totalWords: words,
      sections,
    };
  }

  /**
   * 检查对象是否为非空
   */
  private isNonEmpty(obj: any): boolean {
    if (!obj) return false;
    if (typeof obj === 'string') return obj.trim().length > 0;
    if (Array.isArray(obj)) return obj.length > 0;
    if (typeof obj === 'object') return Object.keys(obj).length > 0;
    return false;
  }
}
