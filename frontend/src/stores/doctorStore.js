import { defineStore } from 'pinia';
import api from '../axios/api';

export const useDoctorStore = defineStore('doctor', {
    state: () => ({
        doctors: [],
        currentDoctor: null,
        remunerationRules: [],
        loading: false,
        error: null,
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        }
    }),
    actions: {
        async fetchDoctors(page = 1, limit = 10, search = '', type = '', specializationId = '') {
            this.loading = true;
            try {
                const response = await api.get('/doctors', {
                    params: { page, limit, search, type, specializationId }
                });
                this.doctors = response.data.data;
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
                return { success: true, data: this.doctors };
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to fetch doctors';
                this.error = message;
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async createDoctor(doctorData) {
            this.loading = true;
            try {
                const response = await api.post('/doctors', doctorData);
                this.doctors.unshift(response.data.data);
                return { success: true, message: response.data.message };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create doctor';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async fetchDoctorById(id) {
            this.loading = true;
            try {
                const response = await api.get(`/doctors/${id}`);
                this.currentDoctor = response.data.data;
                return { success: true, data: this.currentDoctor };
            } catch (error) {
                console.error('Error fetching doctor details:', error);
                const message = error.response?.data?.message || 'Failed to fetch doctor details';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async fetchRemunerationRules(doctorId) {
            this.loading = true;
            try {
                const response = await api.get(`/doctors/${doctorId}/remuneration-rules`);
                this.remunerationRules = response.data.data;
                return { success: true, data: this.remunerationRules };
            } catch (error) {
                console.error('Error fetching remuneration rules:', error);
                const message = error.response?.data?.message || 'Failed to fetch rules';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async addRemunerationRule(doctorId, ruleData) {
            this.loading = true;
            try {
                const response = await api.post(`/doctors/${doctorId}/remuneration-rules`, ruleData);
                this.remunerationRules.unshift(response.data.data);
                return { success: true, message: 'Rule added successfully' };
            } catch (error) {
                console.error('Error adding rule:', error);
                const message = error.response?.data?.message || 'Failed to add rule';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteRemunerationRule(ruleId) {
            this.loading = true;
            try {
                await api.delete(`/doctors/remuneration-rules/${ruleId}`);
                this.remunerationRules = this.remunerationRules.filter(r => r._id !== ruleId);
                return { success: true, message: 'Rule deleted successfully' };
            } catch (error) {
                console.error('Error deleting rule:', error);
                const message = error.response?.data?.message || 'Failed to delete rule';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
