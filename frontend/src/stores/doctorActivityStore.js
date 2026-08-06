import { defineStore } from 'pinia';
import api from '../axios/api';

export const useDoctorActivityStore = defineStore('doctorActivity', {
    state: () => ({
        doctors: [],
        activityDetails: null,
        activityLogs: null,
        loading: false,
        loadingLogs: false,
        error: null,
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        }
    }),

    actions: {
        async fetchDoctorActivities(params = {}) {
            this.loading = true;
            this.error = null;
            try {
                const query = new URLSearchParams();
                query.append('page', params.page || 1);
                query.append('limit', params.limit || 10);
                if (params.search) query.append('search', params.search);
                if (params.doctorType) query.append('doctorType', params.doctorType);
                if (params.specializationId) query.append('specializationId', params.specializationId);

                const response = await api.get(`/doctor-activity?${query.toString()}`);
                this.doctors = response.data.data;
                this.pagination = response.data.pagination || {
                    total: this.doctors.length,
                    page: 1,
                    limit: 10,
                    pages: 1
                };
                return { success: true, data: this.doctors, pagination: this.pagination };
            } catch (error) {
                console.error('Error fetching doctor activities:', error);
                this.error = error.response?.data?.message || 'Failed to fetch doctor activity list';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async fetchDoctorActivityById(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get(`/doctor-activity/${id}`);
                this.activityDetails = response.data.data;
                return { success: true, data: this.activityDetails };
            } catch (error) {
                console.error('Error fetching doctor activity details:', error);
                this.error = error.response?.data?.message || 'Failed to fetch doctor activity details';
                return { success: false, message: this.error };
            } finally {
                this.loading = false;
            }
        },

        async fetchDoctorActivityLogs(doctorId, params = {}) {
            this.loadingLogs = true;
            try {
                const query = new URLSearchParams();
                if (params.range) query.append('range', params.range);
                if (params.startDate) query.append('startDate', params.startDate);
                if (params.endDate) query.append('endDate', params.endDate);
                if (params.type) query.append('type', params.type);

                const response = await api.get(`/doctor-activity/${doctorId}/logs?${query.toString()}`);
                this.activityLogs = response.data.data;
                return { success: true, data: this.activityLogs };
            } catch (error) {
                console.error('Error fetching doctor activity logs:', error);
                return { success: false, message: error.response?.data?.message || 'Failed to fetch logs' };
            } finally {
                this.loadingLogs = false;
            }
        }
    }
});
