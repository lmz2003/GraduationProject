import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled Components
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const LoginForm = styled.div`
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  animation: fadeIn 0.5s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
`;

const InputGroup = styled.div`
  margin-bottom: 25px;
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &.error {
    border-color: #e74c3c;
  }
`;

const PhoneInputWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const PhonePrefix = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f5f5f5;
  font-weight: 600;
  color: #666;
  transition: border-color 0.3s ease;

  &:focus-within {
    border-color: #667eea;
  }
`;

const VerificationCodeWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const SendCodeButton = styled.button<{ $isDisabled: boolean; $isCounting: boolean }>`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  ${props => props.$isCounting ? `
    background-color: #bdc3c7;
    color: white;
    cursor: not-allowed;
  ` : props.$isDisabled ? `
    background-color: #bdc3c7;
    color: white;
    cursor: not-allowed;
  ` : `
    background-color: #667eea;
    color: white;
  `}

  &:hover:not(:disabled):not(${props => props.$isCounting && '&'}) {
    background-color: #5568d3;
  }
`;

const LoginButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #667eea;
  color: white;
  margin-top: 10px;

  ${props => props.$isLoading && `
    background-color: #5568d3;
    cursor: not-allowed;
  `}

  &:hover:not(:disabled) {
    background-color: #5568d3;
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
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

const SuccessMessage = styled.div`
  color: #27ae60;
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
  animation: fadeIn 0.5s;
`;

// Login Component
const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [phoneNumberValid, setPhoneNumberValid] = useState<boolean>(true);
  const [codeValid, setCodeValid] = useState<boolean>(true);

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
        // Let parent component handle login state change
        window.location.reload();
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
    <LoginContainer>
      <LoginForm>
        <Logo>Login</Logo>

        <InputGroup>
          <InputLabel>Phone Number</InputLabel>
          <PhoneInputWrapper>
            <PhonePrefix>+86</PhonePrefix>
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
          <InputLabel>Verification Code</InputLabel>
          <VerificationCodeWrapper>
            <InputField
              type="tel"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              placeholder="6-digit code"
              maxLength={6}
              className={!codeValid ? 'error' : ''}
              disabled={isLoading}
            />
            <SendCodeButton
          $isDisabled={!phoneNumber || countdown > 0 || isSendingCode}
          $isCounting={countdown > 0}
          onClick={handleSendCode}
          disabled={isLoading}
        >
              {countdown > 0 ? `${countdown}s` : 'Get Code'}
            </SendCodeButton>
          </VerificationCodeWrapper>
        </InputGroup>

        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

        <LoginButton
          $isLoading={isLoading}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </LoginButton>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;