import { defineStore } from 'pinia';
import api from '../axios/api';

export const useOpdStore = defineStore('opd', {
    state: () => ({
        appointments: [],
        opdDoctors: [], // specifically for doctors with OPD remuneration rules
        pagination: { total: 0, page: 1, pages: 1 },
        loading: false,
        error: null
    }),
    actions: {
        async fetchAppointments(filters = {}) {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                params.append('page', filters.page || 1);
                params.append('limit', filters.limit || 10);
                
                if (filters.status) params.append('status', filters.status);
                if (filters.doctorId) params.append('doctorId', filters.doctorId);
                if (filters.date) params.append('date', filters.date);
                if (filters.search) params.append('search', filters.search);
                
                const response = await api.get(`/opd/appointments?${params.toString()}`);
                this.appointments = response.data.data.appointments;
                this.pagination = response.data.data.pagination;
                return { success: true };
            } catch (error) {
                console.error('Error fetching appointments:', error);
                this.error = error.response?.data?.message || 'Failed to fetch appointments';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async fetchOpdDoctors() {
            this.loading = true;
            try {
                const response = await api.get('/opd/doctors');
                this.opdDoctors = response.data.data;
                return { success: true };
            } catch (error) {
                console.error('Error fetching OPD doctors:', error);
                this.error = error.response?.data?.message || 'Failed to fetch OPD doctors';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async bookAppointment(data) {
            this.loading = true;
            try {
                const response = await api.post('/opd/appointments', data);
                this.appointments.unshift(response.data.data);
                return { success: true, data: response.data.data, message: 'Appointment booked successfully' };
            } catch (error) {
                console.error('Error booking appointment:', error);
                this.error = error.response?.data?.message || 'Failed to book appointment';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async deleteAppointment(id) {
            this.loading = true;
            try {
                await api.delete(`/opd/appointments/${id}`);
                this.appointments = this.appointments.filter(app => app._id !== id);
                this.pagination.total -= 1;
                return { success: true, message: 'Appointment deleted successfully' };
            } catch (error) {
                console.error('Error deleting appointment:', error);
                this.error = error.response?.data?.message || 'Failed to delete appointment';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async getAppointmentById(id) {
            this.loading = true;
            try {
                const response = await api.get(`/opd/appointments/${id}`);
                return response.data.data;
            } catch (error) {
                console.error('Error fetching appointment:', error);
                throw error;
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
                const response = await api.post('/billing/generate-from-opd-appointment', payload);
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
        },
        async fetchAppointmentsReport(filters = {}) {
            this.loading = true;
            try {
                const params = new URLSearchParams();
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                if (filters.doctorId) params.append('doctorId', filters.doctorId);
                
                const response = await api.get(`/opd/appointments/report?${params.toString()}`);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error fetching appointments report:', error);
                this.error = error.response?.data?.message || 'Failed to fetch appointments report';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        }
    }
});
