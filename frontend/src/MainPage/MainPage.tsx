import React, { useState, useEffect } from 'react';
import styles from './MainPage.module.scss';
import NoteManagement from '../Note/NoteManagement';
import ResumeAnalysisModule from '../components/ResumeAnalysisModule';
import AIIInterviewModule from '../components/AIIInterviewModule';
import AIAssistant from '../components/AIAssistant';
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
        {!isOpen && (
          <button className={styles.aiToggleBtn} onClick={toggleOpen} title="打开AI助手">
            🤖 AI助手
          </button>
        )}
      </div>
    </header>
  );
};

// MainPage Layout Component
const MainPageLayout: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('notes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const { isOpen: isAssistantOpen } = useAIAssistant();

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
  const handleNavClick = (module: string) => {
    setActiveModule(module);
    if (window.innerWidth <= 900) {
      setIsSidebarCollapsed(true);
    }
  };

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
    window.location.reload();
  };

  return (
    <div className={`${styles.layoutContainer} ${!isAssistantOpen ? styles.aiClosed : ''}`}>
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
          {activeModule === 'notes' && <NoteManagement />}
          {activeModule === 'resume' && <ResumeAnalysisModule />}
          {activeModule === 'interview' && <AIIInterviewModule />}
          {activeModule === 'knowledge' && <div className={styles.placeholderContent}>知识库模块开发中...</div>}
        </main>
      </div>

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