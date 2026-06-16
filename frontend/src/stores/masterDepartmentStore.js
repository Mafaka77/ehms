import { defineStore } from "pinia";
import api from '../axios/api';

export const useMasterDepartmentStore = defineStore('masterDepartment', {
    state: () => ({
        departments: [],
        loading: false,
        error: null,
        searchQuery: '',
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        }
    }),
    
    actions: {
        async fetchDepartments(page = 1, limit = 10, search = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/master/departments', {
                    params: { page, limit, search }
                });
                this.departments = response.data.data;
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching departments:', error);
                this.error = error.response?.data?.message || 'Failed to fetch departments';
            
            } finally {
                this.loading = false;
            }
        },
        
        async createDepartment(departmentData) {
            this.loading = true;
            try {
                const response = await api.post('/master/department', departmentData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create department';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteDepartment(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/master/department/${id}`);
                this.departments = this.departments.filter(dept => dept._id !== id);
                return { success: true, message: response.data.message || 'Department deleted successfully' };
            } catch (error) {
                console.log(error)
                const message = error.response?.data?.message || error.message || 'Failed to delete department';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateDepartment(id, departmentData) {
            this.loading = true;
            try {
                const response = await api.put(`/master/department/${id}`, departmentData);
                const index = this.departments.findIndex(dept => dept._id === id);
                if (index !== -1) {
                    this.departments[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Department updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update department';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
