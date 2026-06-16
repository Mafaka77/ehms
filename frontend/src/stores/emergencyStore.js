import { defineStore } from 'pinia';
import api from '../axios/api';

export const useEmergencyStore = defineStore('emergency', {
    state: () => ({
        visits: [],
        emergencyDoctors: [],
        pagination: { total: 0, page: 1, pages: 1 },
        loading: false,
        error: null
    }),
    actions: {
        async fetchVisits(filters = {}) {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                params.append('page', filters.page || 1);
                params.append('limit', filters.limit || 10);
                
                if (filters.priority) params.append('priority', filters.priority);
                if (filters.doctorId) params.append('doctorId', filters.doctorId);
                if (filters.date) params.append('date', filters.date);
                if (filters.search) params.append('search', filters.search);
                
                const response = await api.get(`/emergency/visits?${params.toString()}`);
                this.visits = response.data.data.visits;
                this.pagination = response.data.data.pagination;
                return { success: true };
            } catch (error) {
                console.error('Error fetching emergency visits:', error);
                this.error = error.response?.data?.message || 'Failed to fetch emergency visits';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async fetchEmergencyDoctors() {
            this.loading = true;
            try {
                const response = await api.get('/emergency/doctors');
                this.emergencyDoctors = response.data.data;
                return { success: true };
            } catch (error) {
                console.error('Error fetching emergency doctors:', error);
                this.error = error.response?.data?.message || 'Failed to fetch emergency doctors';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async registerVisit(data) {
            this.loading = true;
            try {
                const response = await api.post('/emergency/visits', data);
                this.visits.unshift(response.data.data);
                return { success: true, data: response.data.data, message: 'Emergency visit registered successfully' };
            } catch (error) {
                console.error('Error registering emergency visit:', error);
                this.error = error.response?.data?.message || 'Failed to register emergency visit';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async deleteVisit(id) {
            this.loading = true;
            try {
                await api.delete(`/emergency/visits/${id}`);
                this.visits = this.visits.filter(v => v._id !== id);
                this.pagination.total -= 1;
                return { success: true, message: 'Emergency visit deleted successfully' };
            } catch (error) {
                console.error('Error deleting emergency visit:', error);
                this.error = error.response?.data?.message || 'Failed to delete emergency visit';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async getVisitById(id) {
            this.loading = true;
            try {
                const response = await api.get(`/emergency/visits/${id}`);
                return response.data.data;
            } catch (error) {
                console.error('Error fetching emergency visit:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async fetchVisitsReport(filters = {}) {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                if (filters.doctorId) params.append('doctorId', filters.doctorId);
                if (filters.priority) params.append('priority', filters.priority);
                
                const response = await api.get(`/emergency/visits/report?${params.toString()}`);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error fetching emergency visits report:', error);
                this.error = error.response?.data?.message || 'Failed to fetch emergency visits report';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async fetchBillDetails(billId) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get(`/billing/bills/${billId}`);
                return response.data.data;
            } catch (error) {
                console.error('Error fetching bill details:', error);
                this.error = error.response?.data?.message || 'Failed to fetch bill details';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async generateBill(payload) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post('/billing/generate-from-emergency-visit', payload);
                return response.data.data;
            } catch (error) {
                console.error('Error generating bill:', error);
                this.error = error.response?.data?.message || 'Failed to generate bill';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async processPayment(billId, paymentData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post(`/billing/bills/${billId}/pay`, paymentData);
                return response.data.data;
            } catch (error) {
                console.error('Error processing payment:', error);
                this.error = error.response?.data?.message || 'Failed to process payment';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async cancelBill(billId) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post(`/billing/bills/${billId}/cancel`);
                return response.data;
            } catch (error) {
                console.error('Error cancelling bill:', error);
                this.error = error.response?.data?.message || 'Failed to cancel bill';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async cancelPayment(paymentId) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post(`/billing/payments/${paymentId}/cancel`);
                return response.data.data;
            } catch (error) {
                console.error('Error cancelling payment:', error);
                this.error = error.response?.data?.message || 'Failed to cancel payment';
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
