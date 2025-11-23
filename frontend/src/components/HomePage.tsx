import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import Login from './Login';

// 定义主题类型
type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'zh' | 'en';

// 主题配置
const lightTheme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  textPrimary: '#333333',
  textSecondary: '#666666',
  primary: '#667eea',
  primaryHover: '#5568d3',
  secondary: '#764ba2',
  border: '#e0e0e0',
  shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  primary: '#7986cb',
  primaryHover: '#6573c3',
  secondary: '#8e24aa',
  border: '#424242',
  shadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
};

// 国际化文本
const i18n = {
  zh: {
    nav: {
      home: '首页',
      features: '功能',
      about: '关于我们',
      contact: '联系我们',
    },
    hero: {
      title: 'AI面试官系统',
      subtitle: '智能面试解决方案，助您快速提升面试技巧',
      cta: '立即开始',
    },
    features: {
      title: '核心功能',
      cards: [
        {
          icon: '🤖',
          title: 'AI助手模块',
          description: '自然语言问答、知识点讲解、面试技巧指导等核心能力，为您提供全方位的学习支持。',
          button: '了解更多',
        },
        {
          icon: '📝',
          title: 'Markdown笔记模块',
          description: '知识记录、整理与AI辅助编辑功能，让您轻松管理学习内容。',
          button: '了解更多',
        },
        {
          icon: '📚',
          title: '知识库构建模块',
          description: '知识存储、管理与语义增强支持功能，打造个性化学习资源库。',
          button: '了解更多',
        },
        {
          icon: '📄',
          title: '简历门诊模块',
          description: '简历分析、优化建议与个性化修改功能，让您的简历脱颖而出。',
          button: '了解更多',
        },
        {
          icon: '🎯',
          title: 'AI面试模块',
          description: '虚拟面试官体验、题目生成、问答互动与评分反馈功能，模拟真实面试场景。',
          button: '了解更多',
        },
        {
          icon: '📊',
          title: '数据分析模块',
          description: '学习进度跟踪、面试表现分析与个性化建议，助您持续提升。',
          button: '了解更多',
        },
      ],
    },
    login: {
      button: '登录/注册',
      prompt: '已有账号？立即登录开始体验',
    },
    theme: {
      light: '明亮模式',
      dark: '黑暗模式',
      system: '跟随系统',
    },
    language: {
      zh: '中文',
      en: 'English',
    },
  },
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      about: 'About Us',
      contact: 'Contact',
    },
    hero: {
      title: 'AI Interviewer System',
      subtitle: 'Intelligent interview solutions to help you improve your interview skills quickly',
      cta: 'Get Started',
    },
    features: {
      title: 'Core Features',
      cards: [
        {
          icon: '🤖',
          title: 'AI Assistant Module',
          description: 'Core capabilities including natural language Q&A, knowledge explanation, interview skills guidance, providing comprehensive learning support.',
          button: 'Learn More',
        },
        {
          icon: '📝',
          title: 'Markdown Notes Module',
          description: 'Knowledge recording, organizing, and AI-assisted editing functions to easily manage learning content.',
          button: 'Learn More',
        },
        {
          icon: '📚',
          title: 'Knowledge Base Module',
          description: 'Knowledge storage, management, and semantic enhancement support to create a personalized learning resource library.',
          button: 'Learn More',
        },
        {
          icon: '📄',
          title: 'Resume Clinic Module',
          description: 'Resume analysis, optimization suggestions, and personalized modification functions to make your resume stand out.',
          button: 'Learn More',
        },
        {
          icon: '🎯',
          title: 'AI Interview Module',
          description: 'Virtual interviewer experience, question generation, interactive Q&A, and feedback functions to simulate real interview scenarios.',
          button: 'Learn More',
        },
        {
          icon: '📊',
          title: 'Data Analysis Module',
          description: 'Learning progress tracking, interview performance analysis, and personalized suggestions to help you continuously improve.',
          button: 'Learn More',
        },
      ],
    },
    login: {
      button: 'Login/Sign Up',
      prompt: 'Already have an account? Log in to start experiencing',
    },
    theme: {
      light: 'Light Mode',
      dark: 'Dark Mode',
      system: 'System Mode',
    },
    language: {
      zh: 'Chinese',
      en: 'English',
    },
  },
};

// 容器组件
const Container = styled.div<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.background};
  color: ${props => props.theme.textPrimary};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.3s ease;
`;

// 导航栏
const Navbar = styled.nav<{ theme: typeof lightTheme }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  background: ${props => props.theme.surface};
  box-shadow: ${props => props.theme.shadow};
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const Logo = styled.div<{ theme: typeof lightTheme }>`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme.primary} 0%, ${props => props.theme.secondary} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 30px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a<{ theme: typeof lightTheme }>`
  text-decoration: none;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
  transition: color 0.3s ease;

  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const ControlButton = styled.button<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.primaryHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(121, 134, 203, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const IconButton = styled.button<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.surface};
  color: ${props => props.theme.textPrimary};
  border: 1px solid ${props => props.theme.border};
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;

  &:hover {
    background: ${props => props.theme.primary};
    color: white;
    border-color: ${props => props.theme.primary};
  }
`;

const HeroSection = styled.section<{ theme: typeof lightTheme }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  text-align: center;
  background: ${props => props.theme.surface};
  margin-bottom: 50px;
  animation: fadeInUp 0.8s ease;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const HeroTitle = styled.h1<{ theme: typeof lightTheme }>`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(135deg, ${props => props.theme.primary} 0%, ${props => props.theme.secondary} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const HeroSubtitle = styled.p<{ theme: typeof lightTheme }>`
  font-size: 18px;
  color: ${props => props.theme.textSecondary};
  max-width: 700px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const FeaturesSection = styled.section`
  padding: 0 50px 80px;

  @media (max-width: 768px) {
    padding: 0 20px 60px;
  }
`;

const FeaturesTitle = styled.h2<{ theme: typeof lightTheme }>`
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 60px;
  color: ${props => props.theme.textPrimary};

  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 40px;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.surface};
  padding: 40px 30px;
  border-radius: 15px;
  box-shadow: ${props => props.theme.shadow};
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  }

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }
  &:nth-child(6) { animation-delay: 0.6s; }

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3<{ theme: typeof lightTheme }>`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
  color: ${props => props.theme.textPrimary};
`;

const FeatureDescription = styled.p<{ theme: typeof lightTheme }>`
  font-size: 16px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 25px;
  line-height: 1.6;
`;

const FeatureButton = styled.button<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.primaryHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(121, 134, 203, 0.4);
  }
`;

const LoginSection = styled.section<{ theme: typeof lightTheme }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  text-align: center;
  background: ${props => props.theme.surface};
  margin-bottom: 50px;
  border-radius: 20px;
  margin: 0 50px 80px;

  @media (max-width: 768px) {
    padding: 60px 20px;
    margin: 0 20px 60px;
  }
`;

const LoginTitle = styled.h2<{ theme: typeof lightTheme }>`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
  color: ${props => props.theme.textPrimary};

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const LoginSubtitle = styled.p<{ theme: typeof lightTheme }>`
  font-size: 16px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 30px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Footer = styled.footer<{ theme: typeof lightTheme }>`
  padding: 40px 50px;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.textSecondary};
  border-top: 1px solid ${props => props.theme.border};
  text-align: center;

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FooterLink = styled.a<{ theme: typeof lightTheme }>`
  color: ${props => props.theme.textSecondary};
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const Copyright = styled.p`
  font-size: 14px;
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.surface};
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div<{ theme: typeof lightTheme }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: ${props => props.theme.surface};
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
`;


const ReturnButton = styled.button<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.primary};
  border: 1px solid ${props => props.theme.primary};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.primaryHover};
  }
`;


const ModalBody = styled.div`
  padding: 20px;
`;

const HomePage: React.FC = () => {
  // 状态管理
  const [theme, setTheme] = useState<ThemeType>('light');
  const [language, setLanguage] = useState<LanguageType>('zh');
  const [showLogin, setShowLogin] = useState(false);

  // 获取当前主题
  const getCurrentTheme = () => {
    if (theme === 'system') {
      // 模拟系统主题检测
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme;
    }
    return theme === 'dark' ? darkTheme : lightTheme;
  };

  // 国际化文本
  const t = i18n[language];

  return (
    <ThemeProvider theme={getCurrentTheme()}>
      <Container theme={getCurrentTheme()}>
        {/* 导航栏 */}
        <Navbar theme={getCurrentTheme()}>
          <Logo theme={getCurrentTheme()}>AI面试官系统</Logo>
          <NavLinks>
            {Object.entries(t.nav).map(([key, value]) => (
              <NavLink key={key} href={`#${key}`}>{value}</NavLink>
            ))}
          </NavLinks>
          <Controls>
            {/* 语言切换 */}
            <IconButton
              theme={getCurrentTheme()}
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            >
              {language === 'zh' ? 'EN' : '中文'}
            </IconButton>
            {/* 主题切换 */}
            <IconButton
              theme={getCurrentTheme()}
              onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
            >
              {theme === 'light' ? '🌙' : theme === 'dark' ? '💡' : '🎨'}
            </IconButton>
            {/* 登录按钮 */}
            <ControlButton
              theme={getCurrentTheme()}
              onClick={() => setShowLogin(true)}
            >
              {t.login.button}
            </ControlButton>
          </Controls>
        </Navbar>

        {/* Hero Section */}
        <HeroSection theme={getCurrentTheme()}>
          <HeroTitle theme={getCurrentTheme()}>{t.hero.title}</HeroTitle>
          <HeroSubtitle theme={getCurrentTheme()}>{t.hero.subtitle}</HeroSubtitle>
          <ControlButton
            theme={getCurrentTheme()}
            onClick={() => setShowLogin(true)}
          >
            {t.hero.cta}
          </ControlButton>
        </HeroSection>

        {/* Features Section */}
        <FeaturesSection id="features">
          <FeaturesTitle theme={getCurrentTheme()}>{t.features.title}</FeaturesTitle>
          <FeaturesGrid>
            {t.features.cards.map((card, index) => (
              <FeatureCard key={index} theme={getCurrentTheme()}>
                <FeatureIcon>{card.icon}</FeatureIcon>
                <FeatureTitle theme={getCurrentTheme()}>{card.title}</FeatureTitle>
                <FeatureDescription theme={getCurrentTheme()}>{card.description}</FeatureDescription>
                <FeatureButton theme={getCurrentTheme()}>{card.button}</FeatureButton>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </FeaturesSection>

        {/* Login Section */}
        <LoginSection theme={getCurrentTheme()}>
          <LoginTitle theme={getCurrentTheme()}>{t.login.prompt}</LoginTitle>
          <LoginSubtitle theme={getCurrentTheme()}>加入AI面试官系统，提升您的面试技巧</LoginSubtitle>
          <ControlButton
            theme={getCurrentTheme()}
            onClick={() => setShowLogin(true)}
            style={{ fontSize: '18px', padding: '15px 40px' }}
          >
            {t.login.button}
          </ControlButton>
        </LoginSection>

        {/* Footer */}
        <Footer theme={getCurrentTheme()}>
          <FooterLinks>
            <FooterLink href="#about">关于我们</FooterLink>
            <FooterLink href="#privacy">隐私政策</FooterLink>
            <FooterLink href="#terms">使用条款</FooterLink>
            <FooterLink href="#contact">联系我们</FooterLink>
          </FooterLinks>
          <Copyright>© {new Date().getFullYear()} AI面试官系统. All rights reserved.</Copyright>
        </Footer>

        {/* Login Modal */}
        {showLogin && (
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>
                <ReturnButton onClick={() => setShowLogin(false)}>
                  返回
                </ReturnButton>
              </ModalHeader>
              <ModalBody>
                <Login theme={theme}/>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default HomePage;