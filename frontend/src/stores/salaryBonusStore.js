import { defineStore } from "pinia";
import api from '../axios/api';

export const useSalaryBonusStore = defineStore('salaryBonus', {
    state: () => ({
        bonuses: [],
        loading: false,
        error: null
    }),
    
    actions: {
        async fetchBonuses(month = '', year = '', employeeId = '') {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get('/salary-bonuses', {
                    params: { month, year, employeeId }
                });
                this.bonuses = response.data.data;
            } catch (error) {
                console.error('Error fetching bonuses:', error);
                this.error = error.response?.data?.message || 'Failed to fetch salary bonuses';
            } finally {
                this.loading = false;
            }
        },
        
        async upsertBonus(bonusData) {
            this.loading = true;
            try {
                const response = await api.post('/salary-bonus', bonusData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to register salary bonus';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteBonus(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/salary-bonus/${id}`);
                this.bonuses = this.bonuses.filter(bonus => bonus._id !== id);
                return { success: true, message: response.data.message || 'Salary bonus deleted successfully' };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete salary bonus';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        }
    }
});
