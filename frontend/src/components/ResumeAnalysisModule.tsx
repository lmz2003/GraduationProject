import React from 'react';
import styled from 'styled-components';

// Styled components
const ModuleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4eaf2 100%);
  border-radius: 12px;
  border: 2px dashed #b0c4de;
  min-height: 200px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: linear-gradient(135deg, #f0f4f8 0%, #e1e8ed 100%);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

const Icon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  color: #333;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const Description = styled.p`
  color: #666;
  margin: 0.5rem 0 1.5rem 0;
  line-height: 1.6;
  max-width: 300px;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
  width: 100%;
  max-width: 300px;
`;

const FeatureItem = styled.li`
  padding: 0.75rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #555;
  
  &::before {
    content: "📄";
    font-size: 1.2rem;
    margin-top: 0.1rem;
  }
`;

const Button = styled.button`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #667eea;
  color: white;
  margin-top: 1rem;
  opacity: 0.8;
  pointer-events: none;
  
  &:hover {
    background-color: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

// ResumeAnalysisModule component
const ResumeAnalysisModule: React.FC = () => {
  return (
    <ModuleContainer>
      <Icon>📄</Icon>
      <Title>简历分析模块</Title>
      <Description>
        智能简历解析与优化，提升您的求职竞争力
      </Description>
      
      <FeatureList>
        <FeatureItem>自动识别简历关键信息</FeatureItem>
        <FeatureItem>提供个性化优化建议</FeatureItem>
        <FeatureItem>匹配职位需求分析</FeatureItem>
        <FeatureItem>生成专业简历报告</FeatureItem>
      </FeatureList>
      
      <Button>功能开发中，即将上线</Button>
    </ModuleContainer>
  );
};

export default ResumeAnalysisModule;