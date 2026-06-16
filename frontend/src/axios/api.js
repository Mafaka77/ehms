import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // Your Fastify backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if it exists
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

// Response Interceptor: Handle global errors (like expired tokens)
api.interceptors.response.use(
  (response) => {
    // Return the response directly if successful
    return response;
  },
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access - Token may have expired.');
      
      // Clear the local token
      localStorage.removeItem('token');
      
      // Prevent redirecting if we are ALREADY on the login page, 
      // or if the request was to the login endpoint itself.
      const isLoginRequest = error.config.url === '/auth/login';
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
      
      if (!isLoginPage && !isLoginRequest) {
        window.location.href = '/login'; 
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
    