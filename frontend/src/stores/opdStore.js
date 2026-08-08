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
                if (filters.page !== undefined) params.append('page', filters.page);
                if (filters.limit !== undefined) params.append('limit', filters.limit);
                
                if (filters.status) params.append('status', filters.status);
                if (filters.doctorId) params.append('doctorId', filters.doctorId);
                if (filters.date) params.append('date', filters.date);
                if (filters.search) params.append('search', filters.search);
                if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                
                const response = await api.get(`/opd/appointments?${params.toString()}`);
                this.appointments = response.data.data.appointments;
                this.pagination = response.data.data.pagination;
                return { success: true, appointments: response.data.data.appointments };
            } catch (error) {
                console.error('Error fetching appointments:', error);
                this.error = error.response?.data?.message || 'Failed to fetch appointments';
                return { success: false, message: this.error, appointments: [] };
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
        async syncAppointmentDates() {
            this.loading = true;
            try {
                const response = await api.post(`/opd/appointments/sync-dates`);
                return { success: true, message: response.data.message };
            } catch (error) {
                console.error('Error syncing appointment dates:', error);
                this.error = error.response?.data?.message || 'Failed to sync appointment dates';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async updateAppointment(id, data) {
            this.loading = true;
            try {
                const response = await api.put(`/opd/appointments/${id}`, data);
                const index = this.appointments.findIndex(app => app._id === id);
                if (index !== -1) {
                    this.appointments[index] = response.data.data;
                }
                return { success: true, data: response.data.data, message: 'Appointment updated successfully' };
            } catch (error) {
                console.error('Error updating appointment:', error);
                this.error = error.response?.data?.message || 'Failed to update appointment';
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
        async generateChargesBill(data) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post('/billing/generate-from-opd-charges', data);
                return response.data.data;
            } catch (error) {
                console.error('Error generating OPD charges bill:', error);
                this.error = error.response?.data?.message || 'Failed to generate OPD charges bill';
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
        },
        async fetchPatientCharges(appointmentId) {
            this.loading = true;
            try {
                const response = await api.get(`/opd/appointments/${appointmentId}/charges`);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error fetching OPD patient charges:', error);
                const message = error.response?.data?.message || 'Failed to fetch patient charges';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },
        async addPatientCharge(appointmentId, chargeData) {
            this.loading = true;
            try {
                const response = await api.post(`/opd/appointments/${appointmentId}/charges`, chargeData);
                return { success: true, data: response.data.data, message: 'Charge added successfully' };
            } catch (error) {
                console.error('Error adding OPD patient charge:', error);
                const message = error.response?.data?.message || 'Failed to add patient charge';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },
        async deletePatientCharge(appointmentId, chargeId) {
            this.loading = true;
            try {
                const response = await api.delete(`/opd/appointments/${appointmentId}/charges/${chargeId}`);
                return { success: true, message: 'Charge deleted successfully' };
            } catch (error) {
                console.error('Error deleting OPD patient charge:', error);
                const message = error.response?.data?.message || 'Failed to delete charge';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },
        async updatePatientCharge(appointmentId, chargeId, chargeData) {
            this.loading = true;
            try {
                const response = await api.put(`/opd/appointments/${appointmentId}/charges/${chargeId}`, chargeData);
                return { success: true, data: response.data.data, message: 'Charge updated successfully' };
            } catch (error) {
                console.error('Error updating OPD patient charge:', error);
                const message = error.response?.data?.message || 'Failed to update charge';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
