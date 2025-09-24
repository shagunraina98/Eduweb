import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eduweb-eo8i.onrender.com',
  withCredentials: false,
});

// Add request interceptor to include Bearer token (unless explicitly skipped)
api.interceptors.request.use(
  (config) => {
    // If caller sets X-Skip-Auth: 'true', do not attach Authorization header
    const headers: any = config.headers || {};
    const skipAuth = headers['X-Skip-Auth'] === 'true' || headers['x-skip-auth'] === 'true';
    if (!skipAuth && typeof window !== 'undefined') {
      const token = window.localStorage.getItem('jwt');
      if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    // Clean up the custom header before sending
    if (skipAuth) {
      delete (config.headers as any)['X-Skip-Auth'];
      delete (config.headers as any)['x-skip-auth'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
