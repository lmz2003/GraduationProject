import { useState, useEffect } from 'react'
import HomePage from './LoginPage/HomePage'
import MainPage from './MainPage/MainPage'
import './App.css'

function App() {
  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });

  // Listen for changes in localStorage token
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
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

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <HomePage />
      ) : (
        <MainPage />
      )}
    </div>
  )
}

export default App