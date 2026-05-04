import axios from 'axios';

// baseURL sẽ ưu tiên lấy từ biến môi trường (nếu có), 
// nếu không sẽ dùng đường dẫn tương đối '/_backend/api' để Vercel tự điều hướng.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/_backend/api';

const api = axios.create({ 
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor để tự động gắn Token vào Header của mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor xử lý phản hồi, tự động đăng xuất nếu Token hết hạn (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;