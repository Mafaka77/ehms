import { defineStore } from "pinia";
import api from '../axios/api';

export const useMasterDesignationStore = defineStore('masterDesignation', {
    state: () => ({
        designations: [],
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
        async fetchDesignations(page = 1, limit = 10, search = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/master/designations', {
                    params: { page, limit, search }
                });
                this.designations = response.data.data;
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching designations:', error);
                this.error = error.response?.data?.message || 'Failed to fetch designations';
            } finally {
                this.loading = false;
            }
        },
        
        async createDesignation(designationData) {
            this.loading = true;
            try {
                const response = await api.post('/master/designation', designationData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create designation';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteDesignation(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/master/designation/${id}`);
                this.designations = this.designations.filter(desig => desig._id !== id);
                return { success: true, message: response.data.message || 'Designation deleted successfully' };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete designation';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateDesignation(id, designationData) {
            this.loading = true;
            try {
                const response = await api.put(`/master/designation/${id}`, designationData);
                const index = this.designations.findIndex(desig => desig._id === id);
                if (index !== -1) {
                    this.designations[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Designation updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update designation';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
