import { defineStore } from "pinia";
import api from '../axios/api';

export const useEmployeeStore = defineStore('employee', {
    state: () => ({
        employees: [],
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
        async fetchEmployees(page = 1, limit = 10, search = '', departmentId = '', employmentType = '', isActive = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/employees', {
                    params: { page, limit, search, departmentId, employmentType, isActive }
                });
                this.employees = response.data.data;
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching employees:', error);
                this.error = error.response?.data?.message || 'Failed to fetch employees';
            } finally {
                this.loading = false;
            }
        },
        
        async createEmployee(employeeData) {
            this.loading = true;
            try {
                const response = await api.post('/employee', employeeData);
                return { success: true, message: response.data.message };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create employee';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteEmployee(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/employee/${id}`);
                this.employees = this.employees.filter(emp => emp._id !== id);
                return { success: true, message: response.data.message || 'Employee deleted successfully' };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete employee';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateEmployee(id, employeeData) {
            this.loading = true;
            try {
                const response = await api.put(`/employee/${id}`, employeeData);
                const index = this.employees.findIndex(emp => emp._id === id);
                if (index !== -1) {
                    this.employees[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Employee updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update employee';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
