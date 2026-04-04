/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api'; 
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('cf_user');
      const storedToken = localStorage.getItem('cf_token');
      return (storedUser && storedToken) ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Failed to restore auth session', error);
      localStorage.removeItem('cf_user');
      localStorage.removeItem('cf_token');
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout(); 
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(""); 

      const { data } = await api.post('/auth/login', { email, password });

      if (data.token) {
        localStorage.setItem('cf_token', data.token);
        localStorage.setItem('cf_user', JSON.stringify(data));
        setUser(data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      return false;
    } finally {
      setLoading(false); 
    }
  };

  const register = async (email, password) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post('/auth/register', { email, password });
      
      if (data.token) {
        localStorage.setItem('cf_token', data.token);
        localStorage.setItem('cf_user', JSON.stringify(data));
        setUser(data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    setError("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      setError,
      login, 
      register, 
      logout,
      api
    }}>
      {children}
    </AuthContext.Provider>
  );
};
