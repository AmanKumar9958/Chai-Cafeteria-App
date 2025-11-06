import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const API = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach admin token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Global 401 handler: session expired -> clear token and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try { localStorage.removeItem('adminToken'); } catch (e) { console.warn('Failed to clear adminToken', e); }
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        const url = new URL(window.location.href);
        url.pathname = '/login';
        url.searchParams.set('reason', 'session-expired');
        window.location.href = url.toString();
      }
    }
    return Promise.reject(error);
  }
)

export default API
