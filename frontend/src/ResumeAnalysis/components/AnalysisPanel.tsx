import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const Header = styled.div`
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px 0;
`;

const ScoreContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const ScoreCard = styled.div`
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
`;

const ScoreValue = styled.div<{ $score?: number }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => {
    const score = props.$score || 0;
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  }};
  margin-bottom: 4px;
`;

const ScoreLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: ${props => (props.$active ? '#4f46e5' : '#64748b')};
  font-size: 0.95rem;
  font-weight: ${props => (props.$active ? '600' : '500')};
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$active && `
    border-bottom-color: #4f46e5;
  `}
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  padding: 10px 12px;
  background: #f8fafc;
  border-left: 3px solid #4f46e5;
  margin-bottom: 8px;
  border-radius: 4px;
  color: #0f172a;
  font-size: 0.9rem;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
`;

const KeywordContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const KeywordTag = styled.span<{ $count?: number }>`
  background: #ede9fe;
  color: #4f46e5;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  ::after {
    content: '${props => (props.$count && props.$count > 1 ? ` ×${props.$count}` : '')}';
    font-size: 0.8rem;
    color: #7c3aed;
  }
`;

const SuggestionBox = styled.div`
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 12px;
  border-radius: 4px;
  color: #78350f;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TextContent = styled.div`
  color: #0f172a;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

interface Analysis {
  overallScore: number;
  completenessScore: number;
  keywordScore: number;
  formatScore: number;
  experienceScore: number;
  skillsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Record<string, any>;
  keywordAnalysis: Record<string, number>;
  structureAnalysis: Record<string, any>;
  contentAnalysis: Record<string, any>;
  personalInfoSuggestions?: Record<string, any>;
  experienceSuggestions?: Record<string, any>[];
  skillsSuggestions?: Record<string, any>;
}

interface AnalysisPanelProps {
  analysis: Analysis;
  parsedData?: any;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, parsedData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'keywords' | 'details'>('overview');

  const renderOverview = () => (
    <>
      <Section>
        <SectionTitle>💪 优势分析</SectionTitle>
        <List>
          {analysis.strengths && analysis.strengths.map((strength, idx) => (
            <ListItem key={idx}>{strength}</ListItem>
          ))}
        </List>
      </Section>

      <Section>
        <SectionTitle>⚠️ 改进空间</SectionTitle>
        <List>
          {analysis.weaknesses && analysis.weaknesses.map((weakness, idx) => (
            <ListItem key={idx}>{weakness}</ListItem>
          ))}
        </List>
      </Section>
    </>
  );

  const renderSuggestions = () => (
    <>
      {analysis.suggestions?.detailedReport && (
        <Section>
          <SectionTitle>📋 详细评估</SectionTitle>
          <TextContent>{analysis.suggestions.detailedReport}</TextContent>
        </Section>
      )}

      {analysis.suggestions?.personalInfo && (
        <Section>
          <SectionTitle>👤 个人信息优化</SectionTitle>
          <SuggestionBox>{analysis.suggestions.personalInfo}</SuggestionBox>
        </Section>
      )}

      {analysis.personalInfoSuggestions?.suggestion && (
        <Section>
          <TextContent>{analysis.personalInfoSuggestions.suggestion}</TextContent>
        </Section>
      )}

      {analysis.suggestions?.summary && (
        <Section>
          <SectionTitle>📝 专业总结建议</SectionTitle>
          <SuggestionBox>{analysis.suggestions.summary}</SuggestionBox>
        </Section>
      )}

      {analysis.suggestions?.experience && (
        <Section>
          <SectionTitle>💼 工作经验优化</SectionTitle>
          <SuggestionBox>{analysis.suggestions.experience}</SuggestionBox>
          {analysis.experienceSuggestions && analysis.experienceSuggestions.length > 0 && (
            <TextContent style={{ marginTop: '12px' }}>
              {analysis.experienceSuggestions[0]?.suggestion}
            </TextContent>
          )}
        </Section>
      )}

      {analysis.suggestions?.skills && (
        <Section>
          <SectionTitle>🎯 技能优化</SectionTitle>
          <SuggestionBox>{analysis.suggestions.skills}</SuggestionBox>
          {analysis.skillsSuggestions?.suggestion && (
            <TextContent style={{ marginTop: '12px' }}>
              {analysis.skillsSuggestions.suggestion}
            </TextContent>
          )}
        </Section>
      )}

      {analysis.suggestions?.format && (
        <Section>
          <SectionTitle>📐 格式规范</SectionTitle>
          <SuggestionBox>{analysis.suggestions.format}</SuggestionBox>
        </Section>
      )}

      {analysis.suggestions?.education && (
        <Section>
          <SectionTitle>🎓 教育背景</SectionTitle>
          <SuggestionBox>{analysis.suggestions.education}</SuggestionBox>
        </Section>
      )}

      {analysis.suggestions?.projects && (
        <Section>
          <SectionTitle>🚀 项目经验</SectionTitle>
          <SuggestionBox>{analysis.suggestions.projects}</SuggestionBox>
        </Section>
      )}
    </>
  );

  const renderKeywords = () => (
    <>
      <Section>
        <SectionTitle>🔑 识别到的关键词</SectionTitle>
        <KeywordContainer>
          {Object.entries(analysis.keywordAnalysis || {}).map(([keyword, count]) => (
            <KeywordTag key={keyword} $count={count as number}>
              {keyword}
            </KeywordTag>
          ))}
        </KeywordContainer>
      </Section>

      {Object.keys(analysis.keywordAnalysis || {}).length === 0 && (
        <Section>
          <p style={{ color: '#64748b' }}>未识别到关键词</p>
        </Section>
      )}
    </>
  );

  const renderDetails = () => (
    <>
      <Section>
        <SectionTitle>📊 内容分析</SectionTitle>
        {analysis.contentAnalysis && (
          <>
            <TextContent>
              总字数: {analysis.contentAnalysis.totalWords || 0}
            </TextContent>
            {analysis.contentAnalysis.sections && (
              <div style={{ marginTop: '12px' }}>
                <strong>各部分内容数：</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                  {Object.entries(analysis.contentAnalysis.sections).map(([section, count]) => (
                    <li key={section}>
                      {section}: {count}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Section>

      {parsedData && (
        <Section>
          <SectionTitle>🔍 解析数据</SectionTitle>
          <TextContent>
            {JSON.stringify(parsedData, null, 2).substring(0, 500)}...
          </TextContent>
        </Section>
      )}
    </>
  );

  return (
    <Container>
      <Header>
        <Title>简历分析报告</Title>
        <ScoreContainer>
          <ScoreCard>
            <ScoreValue $score={analysis.overallScore}>
              {Math.round(analysis.overallScore)}
            </ScoreValue>
            <ScoreLabel>总体评分</ScoreLabel>
          </ScoreCard>
          <ScoreCard>
            <ScoreValue $score={analysis.completenessScore}>
              {Math.round(analysis.completenessScore)}
            </ScoreValue>
            <ScoreLabel>完整性</ScoreLabel>
          </ScoreCard>
          <ScoreCard>
            <ScoreValue $score={analysis.keywordScore}>
              {Math.round(analysis.keywordScore)}
            </ScoreValue>
            <ScoreLabel>关键词覆盖</ScoreLabel>
          </ScoreCard>
          <ScoreCard>
            <ScoreValue $score={analysis.formatScore}>
              {Math.round(analysis.formatScore)}
            </ScoreValue>
            <ScoreLabel>格式规范</ScoreLabel>
          </ScoreCard>
          <ScoreCard>
            <ScoreValue $score={analysis.experienceScore}>
              {Math.round(analysis.experienceScore)}
            </ScoreValue>
            <ScoreLabel>工作经验</ScoreLabel>
          </ScoreCard>
          <ScoreCard>
            <ScoreValue $score={analysis.skillsScore}>
              {Math.round(analysis.skillsScore)}
            </ScoreValue>
            <ScoreLabel>技能评分</ScoreLabel>
          </ScoreCard>
        </ScoreContainer>
      </Header>

      <Content>
        <TabContainer>
          <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            概览
          </Tab>
          <Tab $active={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')}>
            建议
          </Tab>
          <Tab $active={activeTab === 'keywords'} onClick={() => setActiveTab('keywords')}>
            关键词
          </Tab>
          <Tab $active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
            详情
          </Tab>
        </TabContainer>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'suggestions' && renderSuggestions()}
        {activeTab === 'keywords' && renderKeywords()}
        {activeTab === 'details' && renderDetails()}
      </Content>
    </Container>
  );
};

export default AnalysisPanel;
