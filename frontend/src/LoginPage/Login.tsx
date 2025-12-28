import React, { useState, useEffect } from 'react';
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
  shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
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
  shadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
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
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.primary};
`;

const InputGroup = styled.div`
  margin-bottom: 25px;
  position: relative;
`;

const RememberMeContainer = styled.div<{ theme: typeof lightTheme }>`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-top: -15px;
`;

const RememberMeCheckbox = styled.input`
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const RememberMeLabel = styled.label<{ theme: typeof lightTheme }>`
  cursor: pointer;
  color: ${props => props.theme.textSecondary};
  font-size: 14px;
`;

const InputLabel = styled.label<{ theme: typeof lightTheme }>`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;

const InputField = styled.input<{ theme: typeof lightTheme }>`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: ${props => props.theme.background === '#121212' 
      ? `0 0 0 3px rgba(121, 134, 203, 0.2)`
      : `0 0 0 3px rgba(102, 126, 234, 0.1)`
    };
  }

  &.error {
    border-color: ${props => props.theme.error};
  }
`;

const PhoneInputWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const PhonePrefix = styled.div<{ theme: typeof lightTheme }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  border: 2px solid ${props => props.theme.border};
  border-radius: 8px;
  background-color: ${props => props.theme.background};
  font-weight: 600;
  color: ${props => props.theme.textSecondary};
  transition: border-color 0.3s ease;

  &:focus-within {
    border-color: ${props => props.theme.primary};
  }
`;

const VerificationCodeWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const SendCodeButton = styled.button<{ $isDisabled: boolean; $isCounting: boolean; theme: typeof lightTheme }>`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  ${props => props.$isCounting ? `
    background-color: ${props.theme.border};
    color: ${props.theme.textSecondary};
    cursor: not-allowed;
  ` : props.$isDisabled ? `
    background-color: ${props.theme.border};
    color: ${props.theme.textSecondary};
    cursor: not-allowed;
  ` : `
    background-color: ${props.theme.primary};
    color: white;
  `}

  &:hover:not(:disabled):not(${props => props.$isCounting && '&'}) {
    background-color: ${props => props.theme.primaryHover};
  }
`;

const LoginButton = styled.button<{ $isLoading: boolean; theme: typeof lightTheme }>`
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.theme.primary};
  color: white;
  margin-top: 10px;

  ${props => props.$isLoading && `
    background-color: ${props.theme.primaryHover};
    cursor: not-allowed;
  `}

  &:hover:not(:disabled) {
    background-color: ${props => props.theme.primaryHover};
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
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
  onLogin: (isFirstLogin: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ theme: propTheme, onLogin }) => {
  // Use provided theme or fall back to function
  const theme = getTheme(propTheme);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [phoneNumberValid, setPhoneNumberValid] = useState<boolean>(true);
  const [codeValid, setCodeValid] = useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  // Load remembered phone number on component mount
  useEffect(() => {
    const savedPhoneNumber = localStorage.getItem('rememberedPhoneNumber');
    if (savedPhoneNumber) {
      setPhoneNumber(savedPhoneNumber);
      setRememberMe(true);
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Handle phone number change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setPhoneNumber(value.slice(0, 11)); // Limit to 11 digits
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle verification code change
  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setVerificationCode(value.slice(0, 6)); // Limit to 6 digits
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Send verification code
  const handleSendCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMessage('Please enter a valid phone number');
      setPhoneNumberValid(false);
      return;
    }

    setIsSendingCode(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Send request to backend API
      const response = await fetch('http://localhost:3001/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Verification code sent successfully');
        setCountdown(60); // Start 60-second countdown
      } else {
        setErrorMessage(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      setErrorMessage('Network error, please try again later');
      console.error('Send code error:', error);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    // Validate inputs
    const isPhoneValid = validatePhoneNumber(phoneNumber);
    const isCodeValid = verificationCode.length === 6;

    setPhoneNumberValid(isPhoneValid);
    setCodeValid(isCodeValid);

    if (!isPhoneValid || !isCodeValid) {
      setErrorMessage(isPhoneValid ? 'Please enter a 6-digit verification code' : 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Send request to backend API
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Login successful!');
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        
        // Save phone number if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedPhoneNumber', phoneNumber);
        } else {
          // Remove saved phone number if remember me is unchecked
          localStorage.removeItem('rememberedPhoneNumber');
        }
        
        // Pass isFirstLogin to parent component via callback
        const isFirstLogin = data.isFirstLogin || false;
        onLogin(isFirstLogin);
      } else {
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (error) {
      setErrorMessage('Network error, please try again later');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer theme={theme}>
      <LoginForm theme={theme}>
        <Logo theme={theme}>登录</Logo>

        <InputGroup>
          <InputLabel theme={theme}>手机号</InputLabel>
          <PhoneInputWrapper>
            <PhonePrefix theme={theme}>+86</PhonePrefix>
            <InputField
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="138****8888"
              maxLength={11}
              className={!phoneNumberValid ? 'error' : ''}
              disabled={isLoading}
            />
          </PhoneInputWrapper>
        </InputGroup>

        <InputGroup>
          <InputLabel theme={theme}>验证码</InputLabel>
          <VerificationCodeWrapper>
            <InputField
              type="tel"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              placeholder="******"
              maxLength={6}
              className={!codeValid ? 'error' : ''}
              disabled={isLoading}
            />
            <SendCodeButton
          $isDisabled={!phoneNumber || countdown > 0 || isSendingCode}
          $isCounting={countdown > 0}
          onClick={handleSendCode}
          disabled={isLoading}
          theme={theme}
        >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </SendCodeButton>
          </VerificationCodeWrapper>
        </InputGroup>

        <RememberMeContainer theme={theme}>
          <RememberMeCheckbox
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <RememberMeLabel theme={theme} htmlFor="remember-me">
            记住我
          </RememberMeLabel>
        </RememberMeContainer>

        {errorMessage && <ErrorMessage theme={theme}>{errorMessage}</ErrorMessage>}
        {successMessage && <SuccessMessage theme={theme}>{successMessage}</SuccessMessage>}

        <LoginButton
          $isLoading={isLoading}
          onClick={handleLogin}
          disabled={isLoading}
          theme={theme}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </LoginButton>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;