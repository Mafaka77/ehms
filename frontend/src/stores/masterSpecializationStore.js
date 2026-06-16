import { defineStore } from "pinia";
import api from '../axios/api';

export const useMasterSpecializationStore = defineStore('masterSpecialization', {
    state: () => ({
        specializations: [],
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
        async fetchSpecializations(page = 1, limit = 10, search = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/master/specializations', {
                    params: { page, limit, search }
                });
                this.specializations = response.data.data;
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching specializations:', error);
                this.error = error.response?.data?.message || 'Failed to fetch specializations';
            } finally {
                this.loading = false;
            }
        },
        
        async createSpecialization(specializationData) {
            this.loading = true;
            try {
                const response = await api.post('/master/specialization', specializationData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create specialization';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteSpecialization(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/master/specialization/${id}`);
                this.specializations = this.specializations.filter(spec => spec._id !== id);
                return { success: true, message: response.data.message || 'Specialization deleted successfully' };
            } catch (error) {
                console.error(error);
                const message = error.response?.data?.message || error.message || 'Failed to delete specialization';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateSpecialization(id, specializationData) {
            this.loading = true;
            try {
                const response = await api.put(`/master/specialization/${id}`, specializationData);
                const index = this.specializations.findIndex(spec => spec._id === id);
                if (index !== -1) {
                    this.specializations[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Specialization updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update specialization';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
