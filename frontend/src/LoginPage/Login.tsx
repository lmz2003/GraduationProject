import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// Theme type definition
type ThemeType = 'light' | 'dark' | 'system';

const lightTheme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  textPrimary: '#333333',
  textSecondary: '#666666',
  primary: '#667eea',
  primaryHover: '#5568d3',
  border: '#e0e0e0',
  error: '#e74c3c',
  success: '#27ae60',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const darkTheme = {
  background: '#121212',
  surface: '#2a2a2a', // 稍微亮一点的背景色，提高可读性
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  primary: '#7986cb',
  primaryHover: '#5c6bc0',
  border: '#424242',
  error: '#ef5350',
  success: '#66bb6a',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
};

// Styled Components
const LoginContainer = styled.div<{ theme: typeof lightTheme }>`
  width: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: ${props => props.theme.textPrimary};
`;

const LoginForm = styled.div<{ theme: typeof lightTheme }>`
  background: ${props => props.theme.surface};
  padding: 0 40px 40px;
  border-radius: 0;
  width: 100%;
  animation: fadeIn 0.5s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Logo = styled.div<{ theme: typeof lightTheme }>`
  text-align: center;
  margin-bottom: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.primary};
`;

const Description = styled.p<{ theme: typeof lightTheme }>`
  text-align: center;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 24px;
`;

const GithubButton = styled.button<{ theme: typeof lightTheme; disabled?: boolean }>`
  width: 100%;
  padding: 14px;
  border: 2px solid ${props => props.theme.border};
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  color: ${props => props.theme.background === '#121212' ? '#f5f5f5' : '#111'};
  background: linear-gradient(135deg, #24292e 0%, #111 100%);
  box-shadow: ${props => props.theme.shadow};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const HelperText = styled.div<{ theme: typeof lightTheme }>`
  margin-top: 14px;
  color: ${props => props.theme.textSecondary};
  font-size: 14px;
  text-align: center;
`;

const ErrorMessage = styled.div<{ theme: typeof lightTheme }>`
  color: ${props => props.theme.error};
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
  animation: shake 0.5s;

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const SuccessMessage = styled.div<{ theme: typeof lightTheme }>`
  color: ${props => props.theme.success};
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
  animation: fadeIn 0.5s;
`;

const SubtleText = styled.div<{ theme: typeof lightTheme }>`
  margin-top: 10px;
  color: ${props => props.theme.textSecondary};
  font-size: 12px;
  text-align: center;
`;

// Helper function to get theme from localStorage or system preference
const getTheme = (theme: string | undefined) => {
  if (theme === 'light' || theme === 'dark') {
    return theme === 'light' ? lightTheme : darkTheme;
  }
  // Default to system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? darkTheme : lightTheme;
};

// Login Component with theme prop
interface LoginProps {
  theme?: ThemeType;
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ theme: propTheme, onLogin }) => {
  // Use provided theme or fall back to function
  const theme = getTheme(propTheme);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
  const githubRedirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/login`;

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const exchangeCodeForToken = useCallback(async (authCode: string) => {
    setIsLoading(true);
    clearMessages();

    try {
      const response = await fetch(`${apiBaseUrl}/auth/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: authCode, redirectUri: githubRedirectUri }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'GitHub 登录失败');
      }

      localStorage.setItem('token', data.token);
      localStorage.removeItem('github_oauth_state');

      setSuccessMessage('登录成功，正在进入应用...');
      onLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub 登录失败，请稍后再试';
      setErrorMessage(message);
      console.error('GitHub login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, githubRedirectUri, onLogin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      return;
    }

    const savedState = localStorage.getItem('github_oauth_state');
    if (savedState && state && savedState !== state) {
      setErrorMessage('登录状态已失效，请重新登录');
      params.delete('code');
      params.delete('state');
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }

    exchangeCodeForToken(code);

    // 清理 URL 中的 code/state，防止重复触发
    params.delete('code');
    params.delete('state');
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.replaceState({}, document.title, newUrl);
  }, [exchangeCodeForToken]);

  const handleGithubLogin = () => {
    clearMessages();

    if (!githubClientId) {
      setErrorMessage('GitHub Client ID 未配置，请联系管理员');
      return;
    }

    const state = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    localStorage.setItem('github_oauth_state', state);

    const authorizationUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}`
      + `&redirect_uri=${encodeURIComponent(githubRedirectUri)}`
      + '&scope=read:user%20user:email'
      + `&state=${state}`;

    window.location.href = authorizationUrl;
  };

  return (
    <LoginContainer theme={theme}>
      <LoginForm theme={theme}>
        <Logo theme={theme}>使用 GitHub 登录</Logo>
        <Description theme={theme}>一键授权，直接使用您的 GitHub 账号与头像信息</Description>

        {errorMessage && <ErrorMessage theme={theme}>{errorMessage}</ErrorMessage>}
        {successMessage && <SuccessMessage theme={theme}>{successMessage}</SuccessMessage>}

        <GithubButton
          theme={theme}
          onClick={handleGithubLogin}
          disabled={isLoading}
        >
          {isLoading ? '正在登录...' : 'Continue with GitHub'}
        </GithubButton>

        <HelperText theme={theme}>系统会同步您的 GitHub 昵称、头像与邮箱信息</HelperText>
        <SubtleText theme={theme}>若未跳转，请检查是否屏蔽了弹窗或脚本拦截</SubtleText>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;