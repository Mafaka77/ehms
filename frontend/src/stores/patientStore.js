import { defineStore } from 'pinia';
import api from '../axios/api';

export const usePatientStore = defineStore('patient', {
    state: () => ({
        patients: [],
        searchResults: [],
        loading: false,
        error: null
    }),
    actions: {
        async searchPatients(query) {
            if (!query) {
                this.searchResults = [];
                return { success: true, data: [] };
            }
            this.loading = true;
            try {
                const response = await api.get('/patients', {
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

        async createPatient(data) {
            this.loading = true;
            try {
                const response = await api.post('/patients', data);
                // Optionally add to list if needed
                this.patients.unshift(response.data.data);
                return { success: true, data: response.data.data, message: 'Patient created successfully' };
            } catch (error) {
                console.error('Error creating patient:', error);
                this.error = error.response?.data?.message || 'Failed to create patient';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        }
    }
});
