import { defineStore } from 'pinia';
import api from '../axios/api';

export const useDentalStore = defineStore('dental', {
    state: () => ({
        appointments: [],
        dentalDoctors: [],
        pagination: { total: 0, page: 1, pages: 1 },
        loading: false,
        error: null
    }),
    actions: {
        async addCharge(appointmentId, chargeData) {
            this.loading = true;
            try {
                const response = await api.post(`/dental/appointments/${appointmentId}/charges`, chargeData);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error adding charge:', error);
                this.error = error.response?.data?.message || 'Failed to add charge';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async getCharges(appointmentId) {
            this.loading = true;
            try {
                const response = await api.get(`/dental/appointments/${appointmentId}/charges`);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error fetching charges:', error);
                this.error = error.response?.data?.message || 'Failed to fetch charges';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async deleteCharge(appointmentId, chargeId) {
            this.loading = true;
            try {
                const response = await api.delete(`/dental/appointments/${appointmentId}/charges/${chargeId}`);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error deleting charge:', error);
                this.error = error.response?.data?.message || 'Failed to delete charge';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async updatePatientCharge(appointmentId, chargeId, updateData) {
            this.loading = true;
            try {
                const response = await api.put(`/dental/appointments/${appointmentId}/charges/${chargeId}`, updateData);
                return { success: true, data: response.data.data, message: 'Charge updated successfully' };
            } catch (error) {
                console.error('Error updating patient charge:', error);
                return { success: false, message: error.response?.data?.message || 'Failed to update charge' };
            } finally {
                this.loading = false;
            }
        },

        async getInstallments(appointmentId) {
            this.loading = true;
            try {
                const response = await api.get(`/dental/appointments/${appointmentId}/installments`);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error fetching installments:', error);
                this.error = error.response?.data?.message || 'Failed to fetch installments';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async addInstallment(appointmentId, chargeId, data) {
            this.loading = true;
            try {
                const response = await api.post(`/dental/appointments/${appointmentId}/charges/${chargeId}/installments`, data);
                return { success: true, data: response.data.data };
            } catch (error) {
                console.error('Error adding installment:', error);
                this.error = error.response?.data?.message || 'Failed to add installment';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },


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
                
                const response = await api.get(`/dental/appointments?${params.toString()}`);
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
        async fetchDentalDoctors() {
            this.loading = true;
            try {
                const response = await api.get('/dental/doctors');
                this.dentalDoctors = response.data.data;
                return { success: true };
            } catch (error) {
                console.error('Error fetching Dental doctors:', error);
                this.error = error.response?.data?.message || 'Failed to fetch Dental doctors';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async bookAppointment(data) {
            this.loading = true;
            try {
                const response = await api.post('/dental/appointments', data);
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
                await api.delete(`/dental/appointments/${id}`);
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
        async updateAppointmentStatus(id, status) {
            this.loading = true;
            try {
                const response = await api.put(`/dental/appointments/${id}/status`, { status });
                // If it's in the current appointments list, update it
                const index = this.appointments.findIndex(app => app._id === id);
                if (index !== -1) {
                    this.appointments[index].treatmentStatus = status;
                }
                return { success: true, data: response.data.data, message: 'Treatment status updated' };
            } catch (error) {
                console.error('Error updating status:', error);
                this.error = error.response?.data?.message || 'Failed to update status';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },
        async getAppointmentById(id) {
            this.loading = true;
            try {
                const response = await api.get(`/dental/appointments/${id}`);
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
                const response = await api.post('/billing/generate-from-dental-appointment', payload);
                return response.data.data;
            } catch (error) {
                console.error('Error generating bill:', error);
                this.error = error.response?.data?.message || 'Failed to generate bill';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async generateConsultationBill(payload) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post('/billing/generate-from-dental-consultation', payload);
                return response.data.data;
            } catch (error) {
                console.error('Error generating consultation bill:', error);
                this.error = error.response?.data?.message || 'Failed to generate consultation bill';
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
                
                const response = await api.get(`/dental/appointments/report?${params.toString()}`);
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
