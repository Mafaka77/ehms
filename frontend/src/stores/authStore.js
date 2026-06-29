import { defineStore } from 'pinia';
import api from '../axios/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  }),
  
  getters: {
    decodedToken: (state) => {
      if (!state.token) return null;
      try {
        const base64Url = state.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    },
    user: (state) => {
      // Return the full decoded token payload (which contains _id, role)
      return state.decodedToken;
    },
    permissions: (state) => {
      // Return the array of permissions (e.g., ['patient.view', ...])
      return state.decodedToken?.permissions || [];
    }
  },
  
  actions: {
    hasPermission(permissionCode) {
      if (!permissionCode) return true; // If no permission required, always allow
      return this.permissions.includes(permissionCode);
    },
    async login(email, password) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.post('/auth/login', { email, password });
        console.log(response);
        const token = response.data.data;
        
        this.token = token;
        this.isAuthenticated = true;
        localStorage.setItem('token', token);
        return true;
      } catch (err) {
        console.log(err.response?.data?.message);
        this.error = err.response?.data?.message || 'Login failed. Please try again.';
        this.isAuthenticated = false;
        return false; 
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      this.token = null;
      this.isAuthenticated = false;
      this.error = null;
      
      // Clear token from localStorage
      localStorage.removeItem('token');
    },

    async fetchRoles() {
      try {
        const response = await api.get('/auth/roles');
        return response.data.data;
      } catch (err) {
        console.error('Error fetching roles:', err);
        return [];
      }
    },

    async createRole(data) {
      try {
        const response = await api.post('/auth/roles', data);
        return { success: true, data: response.data.data };
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create role';
        return { success: false, message };
      }
    },

    async updateRole(id, data) {
      try {
        const response = await api.put(`/auth/roles/${id}`, data);
        return { success: true, data: response.data.data };
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to update role';
        return { success: false, message };
      }
    },
    
    async checkLoginStatus(email) {
      try {
        const response = await api.get('/auth/check-login', { params: { email } });
        return response.data;
      } catch (err) {
        console.error('Error checking login status:', err);
        return { enabled: false };
      }
    },
    
    async enableLogin(employeeId, password, roleId) {
      try {
        const response = await api.post('/auth/enable-login', { employeeId, password, roleId });
        return { success: true, message: response.data.message || 'Login enabled successfully' };
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to enable login';
        return { success: false, message };
      }
    }
  }
});
