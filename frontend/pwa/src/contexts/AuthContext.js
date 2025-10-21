import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || 'https://mellchat-production.up.railway.app';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token function
  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToVerify}`
        },
        body: JSON.stringify({ token: tokenToVerify }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('mellchat-token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('mellchat-token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Check for token in URL (from OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const authStatus = params.get('auth');
    
    if (urlToken && authStatus === 'success') {
      localStorage.setItem('mellchat-token', urlToken);
      setToken(urlToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      verifyToken(urlToken);
    } else {
      // Check for existing token
      const savedToken = localStorage.getItem('mellchat-token');
      if (savedToken) {
        setToken(savedToken);
        verifyToken(savedToken);
      } else {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('mellchat-token');
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

