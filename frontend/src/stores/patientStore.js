import { defineStore } from 'pinia';
import api from '../axios/api';

export const usePatientStore = defineStore('patient', {
    state: () => ({
        patients: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 1 },
        searchResults: [],
        selectedPatient: null,
        loading: false,
        error: null
    }),

    actions: {
        async fetchPatients(params = {}) {
            this.loading = true;
            this.error = null;
            try {
                const query = new URLSearchParams();
                query.append('page', params.page || 1);
                query.append('limit', params.limit || 10);

                if (params.search) query.append('search', params.search);
                if (params.gender) query.append('gender', params.gender);
                if (params.bloodGroup) query.append('bloodGroup', params.bloodGroup);

                const response = await api.get(`/patients?${query.toString()}`);
                this.patients = response.data.data;
                this.pagination = response.data.pagination || { total: this.patients.length, page: 1, limit: 10, pages: 1 };
                return { success: true, data: this.patients, pagination: this.pagination };
            } catch (error) {
                console.error('Error fetching patients:', error);
                this.error = error.response?.data?.message || 'Failed to fetch patients';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async searchPatients(query) {
            if (!query) {
                this.searchResults = [];
                return { success: true, data: [] };
            }
            this.loading = true;
            try {
                const response = await api.get('/patients/search', {
                    params: { search: query, limit: 10 }
                });
                this.searchResults = response.data.data;
                return { success: true, data: this.searchResults };
            } catch (error) {
                console.error('Error searching patients:', error);
                this.error = error.response?.data?.message || 'Failed to search patients';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async getPatientById(id) {
            this.loading = true;
            try {
                const response = await api.get(`/patients/${id}`);
                this.selectedPatient = response.data.data;
                return { success: true, data: this.selectedPatient };
            } catch (error) {
                console.error('Error getting patient:', error);
                this.error = error.response?.data?.message || 'Failed to get patient details';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async createPatient(data) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post('/patients', data);
                const newPatient = response.data.data;
                this.patients.unshift(newPatient);
                return { success: true, data: newPatient, message: response.data.message || 'Patient created successfully' };
            } catch (error) {
                console.error('Error creating patient:', error);
                this.error = error.response?.data?.message || 'Failed to create patient';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async updatePatient(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.put(`/patients/${id}`, data);
                const updated = response.data.data;
                const idx = this.patients.findIndex(p => p._id === id);
                if (idx !== -1) {
                    this.patients[idx] = updated;
                }
                return { success: true, data: updated, message: response.data.message || 'Patient updated successfully' };
            } catch (error) {
                console.error('Error updating patient:', error);
                this.error = error.response?.data?.message || 'Failed to update patient';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async deletePatient(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.delete(`/patients/${id}`);
                this.patients = this.patients.filter(p => p._id !== id);
                return { success: true, message: response.data.message || 'Patient deleted successfully' };
            } catch (error) {
                console.error('Error deleting patient:', error);
                this.error = error.response?.data?.message || 'Failed to delete patient';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        }
    }
});
