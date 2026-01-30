import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './MainPage.module.scss';
import NotesListPage from '../Note/NotesListPage';
import ResumeAnalysisModule from '../components/ResumeAnalysisModule';
import AIIInterviewModule from '../components/AIIInterviewModule';
import KnowledgeBase from '../KnowledgeBase/KnowledgeBase';
import AIAssistant from '../AIAssistant/AIAssistant';
import { AIAssistantProvider, useAIAssistant } from '../context/AIAssistantContext';

// Header Component to use context
const Header: React.FC<{ 
  activeModule: string; 
  userData: { name: string }; 
}> = ({ activeModule, userData }) => {
  const { isOpen, toggleOpen } = useAIAssistant();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.pageTitle}>
          {activeModule === 'home' && '欢迎回来'}
          {activeModule === 'notes' && '我的笔记'}
          {activeModule === 'resume' && '简历分析'}
          {activeModule === 'interview' && '模拟面试'}
          {activeModule === 'knowledge' && '知识库'}
        </h1>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.headerUser}>
          <span>欢迎回来, {userData.name}</span>
        </div>
        <button 
          className={`${styles.aiToggleBtn} ${isOpen ? styles.active : ''}`}
          onClick={toggleOpen} 
          title={isOpen ? '关闭AI助手' : '打开AI助手'}
        >
          🤖 AI助手
        </button>
      </div>
    </header>
  );
};

// MainPage Layout Component
const MainPageLayout: React.FC = () => {
  const { module } = useParams<{ module?: string }>();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string>(module || 'home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const { isOpen: isAssistantOpen } = useAIAssistant();
  const [mainWidth, setMainWidth] = useState<number>(() => {
    const saved = localStorage.getItem('mainLayoutWidth');
    return saved ? parseInt(saved) : 65; // 默认 65% 宽度
  });
  const [isDragging, setIsDragging] = useState(false);

  // Initialize sidebar state based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理拖动分隔线
  const handleDividerMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector(`.${styles.layoutContainer}`) as HTMLElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const sidebar = document.querySelector(`.${styles.sidebar}`) as HTMLElement;
      if (!sidebar) return;

      const sidebarWidth = sidebar.offsetWidth;
      const containerWidth = containerRect.width;

      // 计算鼠标相对于 sidebar 右边的位置
      const mainAndDividerWidth = e.clientX - (containerRect.left + sidebarWidth);
      const newMainWidth = (mainAndDividerWidth / (containerWidth - sidebarWidth)) * 100;

      // 限制主区域宽度在 40% - 80% 之间
      if (newMainWidth >= 40 && newMainWidth <= 80) {
        setMainWidth(newMainWidth);
        localStorage.setItem('mainLayoutWidth', Math.round(newMainWidth).toString());
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // User data state
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: '用户',
    email: '',
    avatar: ''
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiBaseUrl}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.name || data.githubUsername || '用户',
            email: data.email || '',
            avatar: data.avatar || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserData();
  }, []);

  // Handle navigation item click
  const handleNavClick = (targetModule: string) => {
    setActiveModule(targetModule);
    navigate(`/dashboard/${targetModule}`);
    if (window.innerWidth <= 900) {
      setIsSidebarCollapsed(true);
    }
  };

  // Update active module when route changes
  useEffect(() => {
    if (!module) {
      setActiveModule('home');
      return;
    }
    if (module !== activeModule) {
      setActiveModule(module);
    }
  }, [module, activeModule]);

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    if (!name || !name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const aiWidth = 100 - mainWidth;
  // 计算 flex 值，4px 的分隔线宽度相对较小，直接用百分比表示
  const mainFlex = mainWidth;
  const aiFlex = aiWidth;
  const gridTemplate = isAssistantOpen 
    ? `var(--sidebar-width) ${mainFlex}fr 4px ${aiFlex}fr`
    : `var(--sidebar-width) 1fr`;

  return (
    <div 
      className={`${styles.layoutContainer} ${!isAssistantOpen ? styles.aiClosed : ''} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''} ${isDragging ? styles.dragging : ''}`}
      style={isAssistantOpen ? { gridTemplateColumns: gridTemplate } : {}}
    >
      {/* Mobile Overlay for Left Sidebar */}
      {!isSidebarCollapsed && (
        <div className={styles.sidebarOverlay} onClick={() => setIsSidebarCollapsed(true)} />
      )}

      {/* Sidebar (Aside) */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          {!isSidebarCollapsed && <h2 className={styles.sidebarTitle}>AI面试官</h2>}
          <button className={styles.collapseBtn} onClick={toggleSidebar} title={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}>
            {isSidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <div
                className={`${styles.navLink} ${activeModule === 'notes' ? styles.active : ''}`}
                onClick={() => handleNavClick('notes')}
                title="我的笔记"
              >
                <span className={styles.navIcon}>📝</span>
                {!isSidebarCollapsed && <span className={styles.navText}>我的笔记</span>}
              </div>
            </li>
            <li className={styles.navItem}>
              <div
                className={`${styles.navLink} ${activeModule === 'resume' ? styles.active : ''}`}
                onClick={() => handleNavClick('resume')}
                title="我的简历"
              >
                <span className={styles.navIcon}>📄</span>
                {!isSidebarCollapsed && <span className={styles.navText}>我的简历</span>}
              </div>
            </li>
            <li className={styles.navItem}>
              <div
                className={`${styles.navLink} ${activeModule === 'interview' ? styles.active : ''}`}
                onClick={() => handleNavClick('interview')}
                title="我的面试"
              >
                <span className={styles.navIcon}>🤖</span>
                {!isSidebarCollapsed && <span className={styles.navText}>我的面试</span>}
              </div>
            </li>
            <li className={styles.navItem}>
              <div
                className={`${styles.navLink} ${activeModule === 'knowledge' ? styles.active : ''}`}
                onClick={() => handleNavClick('knowledge')}
                title="知识库"
              >
                <span className={styles.navIcon}>📚</span>
                {!isSidebarCollapsed && <span className={styles.navText}>知识库</span>}
              </div>
            </li>
          </ul>
        </nav>

        {/* User Profile in Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>{getInitials(userData.name)}</div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className={styles.userInfo}>
                <h3 className={styles.userName}>{userData.name}</h3>
                <p className={styles.userContact}>{userData.email}</p>
              </div>
            )}
          </div>

          <div
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="退出登录"
          >
            <span className={styles.navIcon}>🚪</span>
            {!isSidebarCollapsed && <span className={styles.navText}>退出</span>}
          </div>
        </div>
      </aside>

      {/* Center Column */}
      <div className={styles.mainWrapper}>
        <Header activeModule={activeModule} userData={userData} />

        {/* Main Content */}
        <main className={styles.mainContent}>
          {activeModule === 'home' && (
            <div className={styles.placeholderContent}>
              欢迎使用 AI 面试官平台，请从左侧选择一个模块开始吧。
            </div>
          )}
          {activeModule === 'notes' && <NotesListPage />}
          {activeModule === 'resume' && <ResumeAnalysisModule />}
          {activeModule === 'interview' && <AIIInterviewModule />}
          {activeModule === 'knowledge' && <KnowledgeBase />}
        </main>
      </div>

      {/* Divider between Main and AI Assistant */}
      {isAssistantOpen && (
        <div 
          className={styles.divider}
          onMouseDown={handleDividerMouseDown}
          title="拖动来调整区域大小"
        />
      )}

      {/* Right Sidebar */}
      <aside className={`${styles.rightSidebar} ${!isAssistantOpen ? styles.aiHidden : ''}`}>
        <AIAssistant />
      </aside>
    </div>
  );
};

const MainPage: React.FC = () => {
  return (
    <AIAssistantProvider>
      <MainPageLayout />
    </AIAssistantProvider>
  );
};

export default MainPage;