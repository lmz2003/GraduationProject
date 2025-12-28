import { useState, useEffect } from 'react'
import HomePage from './LoginPage/HomePage'
import MainPage from './MainPage/MainPage'
import UserSetup from './LoginPage/UserSetup'
import './App.css'

function App() {
  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });

  // Check if user is first login
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(() => {
    const savedIsFirstLogin = localStorage.getItem('isFirstLogin');
    return savedIsFirstLogin === 'true';
  });

  // Listen for changes in localStorage token
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      const savedIsFirstLogin = localStorage.getItem('isFirstLogin');
      
      setIsLoggedIn(!!token);
      // Only set isFirstLogin if token exists
      if (token && savedIsFirstLogin) {
        setIsFirstLogin(savedIsFirstLogin === 'true');
      }
    };

    // Check token on mount
    checkToken();

    // Listen for storage events to detect token changes from other tabs
    window.addEventListener('storage', checkToken);

    // Cleanup listener
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  // Handle user setup complete
  const handleSetupComplete = () => {
    // Update state and remove isFirstLogin from localStorage
    setIsFirstLogin(false);
    localStorage.removeItem('isFirstLogin');
  };

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <HomePage />
      ) : isFirstLogin ? (
        <UserSetup onComplete={handleSetupComplete} />
      ) : (
        <MainPage />
      )}
    </div>
  )
}

export default App
