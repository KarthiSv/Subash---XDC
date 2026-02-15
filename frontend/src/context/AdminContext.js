import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('xdc_admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios
        .get(`${API}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setAdmin(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('xdc_admin_token');
          setToken(null);
          setAdmin(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/admin/login`, { email, password });
    const data = res.data;
    localStorage.setItem('xdc_admin_token', data.access_token);
    setToken(data.access_token);
    setAdmin({ name: data.name, email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('xdc_admin_token');
    setToken(null);
    setAdmin(null);
  };

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  return (
    <AdminContext.Provider value={{ admin, token, loading, login, logout, authHeaders, API }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
