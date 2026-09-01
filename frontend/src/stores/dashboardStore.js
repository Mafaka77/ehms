import { defineStore } from 'pinia'
import api from '../axios/api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: null,
    activity: null,
    defaultDashboard: null,
    chartData: [],
    loading: false,
    loadingActivity: false,
    loadingChart: false,
    loadingDefault: false,
    error: null
  }),

  actions: {
    async fetchAdminStats() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/dashboard/admin/stats')
        this.stats = response.data.data
        return { success: true }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch dashboard stats'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchRecentActivity() {
      this.loadingActivity = true
      try {
        const response = await api.get('/dashboard/admin/activity')
        this.activity = response.data.data
        return { success: true }
      } catch (err) {
        return { success: false, message: err.response?.data?.message || 'Failed to fetch activity' }
      } finally {
        this.loadingActivity = false
      }
    },

    async fetchChartData() {
      this.loadingChart = true
      try {
        const response = await api.get('/dashboard/admin/chart')
        this.chartData = response.data.data
        return { success: true }
      } catch (err) {
        return { success: false, message: err.response?.data?.message || 'Failed to fetch chart data' }
      } finally {
        this.loadingChart = false
      }
    },

    async fetchDefaultDashboard() {
      this.loadingDefault = true
      try {
        const response = await api.get('/dashboard/default')
        this.defaultDashboard = response.data.data
        return { success: true }
      } catch (err) {
        return { success: false, message: err.response?.data?.message || 'Failed to fetch default dashboard data' }
      } finally {
        this.loadingDefault = false
      }
    }
  }
})
