import { defineStore } from "pinia";
import api from '../axios/api';

export const useMasterUserStore = defineStore('masterUser', {
    state: () => ({
        users: [],
        permissions: [],
        loading: false,
        error: null
    }),
    
    actions: {
        async fetchUsers() {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get('/auth/users');
                this.users = response.data.data;
            } catch (error) {
                console.error('Error fetching users:', error);
                this.error = error.response?.data?.message || 'Failed to fetch users';
            } finally {
                this.loading = false;
            }
        },

        async fetchUserById(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get(`/auth/users/${id}`);
                return response.data.data;
            } catch (error) {
                console.error('Error fetching user by ID:', error);
                this.error = error.response?.data?.message || 'Failed to fetch user details';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateUser(id, data) {
            this.loading = true;
            try {
                const response = await api.put(`/auth/users/${id}`, data);
                return { success: true, data: response.data.data, message: response.data.message || 'User updated successfully' };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update user';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteUser(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/auth/users/${id}`);
                this.users = this.users.filter(user => user._id !== id);
                return { success: true, message: response.data.message || 'User deleted successfully' };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete user';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async fetchPermissions() {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get('/auth/permissions');
                this.permissions = response.data.data;
            } catch (error) {
                console.error('Error fetching permissions:', error);
                this.error = error.response?.data?.message || 'Failed to fetch permissions';
            } finally {
                this.loading = false;
            }
        },

        async updateRolePermissions(roleId, permissionIds) {
            this.loading = true;
            try {
                const response = await api.put(`/auth/roles/${roleId}/permissions`, { permissionIds });
                return { success: true, message: response.data.message || 'Role permissions updated successfully' };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update role permissions';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
