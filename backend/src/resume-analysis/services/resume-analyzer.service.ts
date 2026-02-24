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
  resumeType?: 'freshman' | 'experienced';  // ✨ 新增：简历类型识别
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
   * 识别简历类型：校招生 vs 社招
   * freshman: 校招生（应届毕业生、在校学生）
   * experienced: 社招（有工作经验的专业人士）
   */
  private detectResumeType(parsedData: any): 'freshman' | 'experienced' {
    // 指标1：工作经验数量
    const workExperienceCount = parsedData.workExperience?.length || 0;
    
    // 指标2：实习经验数量
    const internshipCount = parsedData.internshipExperience?.length || 0;
    
    // 指标3：校园活动
    const campusExperienceCount = parsedData.campusExperience?.length || 0;
    
    // 指标4：社招特有字段（公司信息、管理经验、离职原因等）
    const hasSocialRecruitmentInfo = parsedData.workExperience?.some((exp: any) => 
      exp.companyType || exp.companyIndustry || exp.teamSize || exp.managementLevel
    );
    
    // 指标5：工作经验时长总和
    let totalWorkMonths = 0;
    if (parsedData.workExperience) {
      for (const exp of parsedData.workExperience) {
        // 简单估算：如果有日期信息就认为有一定时长
        if (exp.startDate && exp.endDate) {
          totalWorkMonths += 12; // 保守估算每个经验12个月
        }
      }
    }
    
    // 判断逻辑
    // 如果有社招特有字段或工作经验 > 2个，则为社招
    // 如果主要是校园活动和实习，则为校招
    if (workExperienceCount > 2 || hasSocialRecruitmentInfo || totalWorkMonths > 24) {
      return 'experienced';
    } else if (campusExperienceCount > 2 || internshipCount >= 2) {
      return 'freshman';
    } else if (workExperienceCount > 0) {
      return 'experienced';
    } else {
      return 'freshman';
    }
  }

  /**
   * 计算完整性评分（差异化：校招 vs 社招）
   */
  private calculateCompletenessScore(parsedData: any, resumeType: 'freshman' | 'experienced'): number {
    let score = 0;
    let components = 0;

    if (resumeType === 'freshman') {
      // ========== 校招生评分权重 ==========
      // 校招生重点：教育背景、项目/实习、校园活动、技能
      const freshmanSections = [
        { name: 'personalInfo', weight: 10 },
        { name: 'education', weight: 25 },        // ⭐ 权重提升（校招重点）
        { name: 'internshipExperience', weight: 20 },  // ⭐ 实习重要
        { name: 'skills', weight: 15 },
        { name: 'projects', weight: 15 },         // ⭐ 项目重要
        { name: 'campusExperience', weight: 10 }, // ⭐ 校园活动
      ];

      for (const section of freshmanSections) {
        components += section.weight;
        if (parsedData[section.name] && this.isNonEmpty(parsedData[section.name])) {
          score += section.weight;
        }
      }

      // 考虑获奖和论文
      if (parsedData.awards && parsedData.awards.length > 0) {
        score += 5;
        components += 5;
      }
      if (parsedData.publications && parsedData.publications.length > 0) {
        score += 5;
        components += 5;
      }
    } else {
      // ========== 社招评分权重 ==========
      // 社招重点：工作经验、技能、项目成果
      const experiencedSections = [
        { name: 'personalInfo', weight: 10 },
        { name: 'professionalSummary', weight: 10 }, // ⭐ 职业总结重要
        { name: 'workExperience', weight: 35 },      // ⭐ 权重最高
        { name: 'skills', weight: 20 },
        { name: 'projects', weight: 15 },            // ⭐ 项目成果
      ];

      for (const section of experiencedSections) {
        components += section.weight;
        if (parsedData[section.name] && this.isNonEmpty(parsedData[section.name])) {
          score += section.weight;
        }
      }

      // 考虑教育、认证
      if (parsedData.education && parsedData.education.length > 0) {
        score += 5;
        components += 5;
      }
      if (parsedData.certifications && parsedData.certifications.length > 0) {
        score += 5;
        components += 5;
      }
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
   * 计算工作经验评分（差异化：校招 vs 社招）
   */
  private calculateExperienceScore(parsedData: any, resumeType: 'freshman' | 'experienced'): number {
    let score = 0;

    if (resumeType === 'freshman') {
      // ========== 校招生：看实习和项目经验 ==========
      const internshipCount = parsedData.internshipExperience?.length || 0;
      const projectCount = parsedData.projects?.length || 0;
      const campusCount = parsedData.campusExperience?.length || 0;
      
      // 实习经验
      if (internshipCount > 0) {
        score += internshipCount >= 2 ? 40 : 25;
      }
      
      // 项目经验
      if (projectCount > 0) {
        score += projectCount >= 2 ? 30 : 20;
      }
      
      // 校园活动
      if (campusCount > 0) {
        score += campusCount >= 2 ? 20 : 10;
      }
      
      // 检查项目/实习描述的详细程度
      const allExperiences = [
        ...(parsedData.internshipExperience || []),
        ...(parsedData.projects || []),
        ...(parsedData.campusExperience || []),
      ];
      
      if (allExperiences.length > 0) {
        const detailedCount = allExperiences.filter(
          (exp: any) => exp.description && exp.description.trim().length > 100
        ).length;
        score += (detailedCount / allExperiences.length) * 20;
      }
    } else {
      // ========== 社招：看工作经验深度和职级 ==========
      const workExperience = parsedData.workExperience || [];
      const workCount = workExperience.length;
      
      if (workCount === 0) return 0;
      
      // 基础分数：工作经验数量
      if (workCount === 1) score += 30;
      else if (workCount === 2) score += 50;
      else if (workCount >= 3) score += 70;
      
      // 检查是否有管理经验（社招重要指标）
      const hasManagementExp = workExperience.some((exp: any) =>
        exp.managementLevel || exp.teamSize || exp.reportsTo
      );
      if (hasManagementExp) {
        score += 15;
      }
      
      // 检查工作描述的详细程度
      const detailedCount = workExperience.filter(
        (exp: any) => exp.description && exp.description.trim().length > 100
      ).length;
      
      score += (detailedCount / Math.max(workCount, 1)) * 25;
      
      // 检查是否有明确的成就（achievements）
      const hasAchievements = workExperience.some((exp: any) =>
        exp.achievements && exp.achievements.length > 0
      );
      if (hasAchievements) {
        score += 10;
      }
    }

    return Math.min(Math.round(score), 100);
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
  /**
   * 生成优势分析（差异化：校招 vs 社招）
   */
  private generateStrengths(parsedData: any, scores: any, resumeType: 'freshman' | 'experienced'): string[] {
    const strengths: string[] = [];

    if (resumeType === 'freshman') {
      // ========== 校招生优势 ==========
      if (scores.completenessScore > 75) {
        strengths.push('简历结构完整，包含了所有关键部分');
      }

      if (parsedData.education && parsedData.education.length > 0) {
        strengths.push('教育背景清晰，展示了扎实的学习基础');
      }

      if (parsedData.internshipExperience && parsedData.internshipExperience.length >= 2) {
        strengths.push('实习经验丰富，展示了职场适应能力');
      }

      if (parsedData.projects && parsedData.projects.length >= 2) {
        strengths.push('项目案例充分，展示了技术实战能力');
      }

      if (parsedData.campusExperience && parsedData.campusExperience.length > 0) {
        strengths.push('校园活动经验丰富，展示了综合能力和组织能力');
      }

      if (parsedData.publications && parsedData.publications.length > 0) {
        strengths.push('学术成果突出，发表过相关论文或研究');
      }

      if (scores.skillsScore > 70) {
        strengths.push('技能列表全面，展示了掌握的关键技术');
      }
    } else {
      // ========== 社招优势 ==========
      if (scores.completenessScore > 75) {
        strengths.push('简历结构完整，信息层次清晰');
      }

      if (parsedData.workExperience && parsedData.workExperience.length >= 3) {
        strengths.push('工作经验丰富，展示了明确的职业发展轨迹');
      }

      // 检查管理经验
      const hasManagementExp = parsedData.workExperience?.some((exp: any) =>
        exp.managementLevel || exp.teamSize
      );
      if (hasManagementExp) {
        strengths.push('具备团队管理或领导经验，展示了承担更大责任的能力');
      }

      // 检查成就
      const hasAchievements = parsedData.workExperience?.some((exp: any) =>
        exp.achievements && exp.achievements.length > 0
      );
      if (hasAchievements) {
        strengths.push('明确的成就记录，展示了实际的业务成果');
      }

      if (parsedData.projects && parsedData.projects.length > 0) {
        strengths.push('项目成果清晰，展示了解决实际问题的能力');
      }

      if (scores.skillsScore > 70) {
        strengths.push('技能体系完整，覆盖多个技术领域和工具');
      }
    }

    // 如果没有发现特殊优势，给出通用反馈
    if (strengths.length === 0) {
      strengths.push('简历包含了基本的职业信息');
    }

    return strengths;
  }

  /**
   * 生成劣势分析（差异化：校招 vs 社招）
   */
  private generateWeaknesses(parsedData: any, scores: any, text: string, resumeType: 'freshman' | 'experienced'): string[] {
    const weaknesses: string[] = [];

    if (resumeType === 'freshman') {
      // ========== 校招生劣势 ==========
      if (scores.completenessScore < 60) {
        weaknesses.push('简历结构不够完整，缺少某些关键部分');
      }

      if (!parsedData.education || parsedData.education.length === 0) {
        weaknesses.push('缺少教育背景信息，这是校招评估的重要部分');
      }

      if (!parsedData.internshipExperience || parsedData.internshipExperience.length === 0) {
        weaknesses.push('缺少实习经验，建议补充在企业或项目中的实战经历');
      } else if (parsedData.internshipExperience.length < 2) {
        weaknesses.push('实习经验偏少，建议补充更多实习案例');
      }

      if (!parsedData.projects || parsedData.projects.length === 0) {
        weaknesses.push('缺少项目案例，建议添加代表作或毕设项目');
      }

      if (!parsedData.skills || parsedData.skills.length < 5) {
        weaknesses.push('技能列表不够详细，建议补充具体掌握的编程语言和技术栈');
      }

      if (!parsedData.campusExperience || parsedData.campusExperience.length === 0) {
        weaknesses.push('缺少校园活动经验，建议补充学生会、社团等活动');
      }
    } else {
      // ========== 社招劣势 ==========
      if (scores.completenessScore < 60) {
        weaknesses.push('简历信息层次不清晰，建议重新组织内容');
      }

      if (!parsedData.workExperience || parsedData.workExperience.length === 0) {
        weaknesses.push('缺少工作经验，这是社招评估的核心');
      } else if (parsedData.workExperience.length < 2) {
        weaknesses.push('工作经验偏少，建议详细补充职业历程');
      }

      // 检查管理经验
      const hasManagementExp = parsedData.workExperience?.some((exp: any) =>
        exp.managementLevel || exp.teamSize
      );
      if (!hasManagementExp && parsedData.workExperience && parsedData.workExperience.length >= 3) {
        weaknesses.push('缺少团队管理或领导经验，这对高级职位很关键');
      }

      // 检查成就
      const hasAchievements = parsedData.workExperience?.some((exp: any) =>
        exp.achievements && exp.achievements.length > 0
      );
      if (!hasAchievements) {
        weaknesses.push('缺少明确的成就记录，建议用数据和案例展示业务成果');
      }

      if (!parsedData.projects || parsedData.projects.length === 0) {
        weaknesses.push('缺少主要项目描述，建议补充核心项目成果');
      }

      if (!parsedData.skills || parsedData.skills.length < 8) {
        weaknesses.push('技能描述不够全面，建议补充核心技能和领域专长');
      }

      if (!parsedData.professionalSummary) {
        weaknesses.push('缺少专业总结，建议添加职业目标和核心优势概述');
      }
    }

    // 检查格式问题（通用）
    const lines = text.split('\n');
    if (lines.length > 100) {
      weaknesses.push('内容过长，建议精简到1-2页');
    }

    if (scores.keywordScore < 50) {
      weaknesses.push('缺少行业关键词，可能影响搜索排名');
    }

    if (weaknesses.length === 0) {
      weaknesses.push('暂未发现明显缺陷');
    }

    return weaknesses;
  }

  /**
   * 生成改进建议
   */
  /**
   * 生成改进建议（差异化：校招 vs 社招）
   */
  private generateSuggestions(parsedData: any, scores: any, resumeType: 'freshman' | 'experienced'): { [key: string]: string } {
    const suggestions: { [key: string]: string } = {};

    // 个人信息建议（通用）
    if (!parsedData.personalInfo || !parsedData.personalInfo.name) {
      suggestions['personalInfo'] =
        '添加清晰的个人信息部分，包括姓名、联系方式和职业头衔（如有）';
    }

    if (resumeType === 'freshman') {
      // ========== 校招生建议 ==========

      // 教育背景建议（校招重点）
      if (!parsedData.education || parsedData.education.length === 0) {
        suggestions['education'] = '添加教育背景，包括学校、专业、学位、GPA（如突出）和预期毕业时间';
      } else {
        suggestions['education'] = '在教育背景中突出GPA、荣誉学位或相关课程，展示学术实力';
      }

      // 实习经验建议
      if (!parsedData.internshipExperience || parsedData.internshipExperience.length === 0) {
        suggestions['internship'] = '补充实习经验，详细说明实习公司、职位、时间和具体工作内容';
      } else if (parsedData.internshipExperience.length === 1) {
        suggestions['internship'] = '补充更多实习经验（建议2-3个），展示不同行业或岗位的工作经验';
      }

      // 项目经验建议
      if (!parsedData.projects || parsedData.projects.length === 0) {
        suggestions['projects'] = '添加2-3个代表性项目（可以是学校项目、竞赛或个人作品），说明项目背景、技术栈和成果';
      } else {
        suggestions['projects'] = '项目描述中要突出技术选择的原因和你的贡献，体现技术深度';
      }

      // 校园活动建议
      if (!parsedData.campusExperience || parsedData.campusExperience.length === 0) {
        suggestions['campus'] = '补充校园活动经验（学生会、社团、班级干部等），展示领导力和组织能力';
      } else {
        suggestions['campus'] = '校园活动中要突出你承担的责任和取得的具体成果';
      }

      // 技能建议
      if (!parsedData.skills || parsedData.skills.length < 5) {
        suggestions['skills'] = '补充技能列表，列出掌握的编程语言、框架和开发工具';
      } else {
        suggestions['skills'] = '按照掌握程度和相关性排序技能，重点突出与应聘岗位相关的核心技能';
      }

      // 论文建议
      if (parsedData.publications && parsedData.publications.length > 0) {
        suggestions['publications'] = '论文成果是亮点，建议在教育部分突出论文信息（期刊、会议等）';
      }

      // 获奖建议
      if (!parsedData.awards || parsedData.awards.length === 0) {
        suggestions['awards'] = '如有竞赛获奖、奖学金等荣誉，建议单独列出，展示综合实力';
      }

    } else {
      // ========== 社招建议 ==========

      // 专业总结建议（社招重点）
      if (!parsedData.professionalSummary) {
        suggestions['summary'] =
          '添加2-3句的职业总结，明确表达你的职业定位、核心竞争力和求职目标';
      } else {
        suggestions['summary'] = '职业总结中要突出行业经验、领域专长和职级成就，帮助招聘方快速了解';
      }

      // 工作经验建议（社招核心）
      if (!parsedData.workExperience || parsedData.workExperience.length === 0) {
        suggestions['experience'] = '详细描述工作经验，使用STAR方法（情景、任务、行动、结果）展示成就和影响力';
      } else {
        suggestions['experience'] = '用数据和具体案例证明成果（如"提升转化率30%"、"管理10人技术团队"），突出商业价值';
      }

      // 管理经验建议
      const hasManagementExp = parsedData.workExperience?.some((exp: any) =>
        exp.managementLevel || exp.teamSize
      );
      if (!hasManagementExp && parsedData.workExperience && parsedData.workExperience.length >= 3) {
        suggestions['management'] = '如有团队管理经验，建议在工作描述中明确突出团队规模、直接下属和管理成果';
      } else if (hasManagementExp) {
        suggestions['management'] = '管理经验是竞争力，建议详细说明团队规模、团队成绩、人才培养等管理成果';
      }

      // 技能建议
      if (!parsedData.skills || parsedData.skills.length < 8) {
        suggestions['skills'] = '补充核心技能和领域专长（工具、方法论、行业知识等），突出职业深度和广度';
      } else {
        suggestions['skills'] = '按照与岗位的相关性排序技能，标注掌握深度（精通/熟悉/了解），优化关键词密度';
      }

      // 项目案例建议
      if (!parsedData.projects || parsedData.projects.length === 0) {
        suggestions['projects'] = '补充1-3个重点项目成果，说明项目规模、你的职责、使用技术和业务成果';
      } else {
        suggestions['projects'] = '项目描述中要突出商业影响力和你的核心贡献，用数据说话';
      }

      // 教育背景建议（社招次要）
      if (parsedData.education && parsedData.education.length > 0) {
        suggestions['education'] = '教育背景可简化，重点突出相关学位和学校，不用详细列出GPA';
      }

      // 证书建议
      if (!parsedData.certifications || parsedData.certifications.length === 0) {
        suggestions['certifications'] = '如有行业认可的证书（如PMP、CPA等），建议列出并说明相关性';
      }
    }

    // 格式建议（通用）
    suggestions['format'] = '确保简历排版清晰、字体一致、内容不超过1-2页，突出视觉层级';

    return suggestions;
  }

  /**
   * 主分析方法（优化：根据简历类型差异化评分）
   */
  async analyzeResume(text: string, parsedData: any): Promise<AnalysisResult> {
    // ✨ 第一步：识别简历类型
    const resumeType = this.detectResumeType(parsedData);

    // ✨ 第二步：根据简历类型进行差异化评分
    const scores = {
      completenessScore: this.calculateCompletenessScore(parsedData, resumeType),
      keywordScoreData: this.calculateKeywordScore(text),
      formatScore: this.calculateFormatScore(text, parsedData),
      experienceScore: this.calculateExperienceScore(parsedData, resumeType),
      skillsScore: this.calculateSkillsScore(parsedData.skills),
    };

    // ✨ 第三步：计算总体评分（加权平均）
    // 注：权重已经在各个评分方法内进行了差异化处理
    const overallScore = Math.round(
      scores.completenessScore * 0.2 +
      scores.keywordScoreData.score * 0.2 +
      scores.formatScore * 0.15 +
      scores.experienceScore * 0.25 +
      scores.skillsScore * 0.2
    );

    const strengths = this.generateStrengths(parsedData, scores, resumeType);
    const weaknesses = this.generateWeaknesses(parsedData, scores, text, resumeType);
    const suggestions = this.generateSuggestions(parsedData, scores, resumeType);

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
      resumeType,  // ✨ 返回简历类型
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
