import { defineStore } from 'pinia'
import api from '../axios/api'

export const useNursingStore = defineStore('nursing', {
  state: () => ({
    stations: [],
    wards: [],
    nurses: [],
    allBeds: [],
    assignments: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    },
    assignmentPagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    },
    myStation: null
  }),

  actions: {
    async fetchWards() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/nursing/wards')
        this.wards = response.data.data
        return this.wards
      } catch (err) {
        console.error('Error fetching wards:', err)
        this.error = err.response?.data?.message || 'Failed to fetch wards'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchNursingStations(page = 1, limit = 10, search = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/nursing/stations', {
          params: { page, limit, search }
        })
        this.stations = response.data.data
        this.pagination = response.data.pagination || {
          total: response.data.data.length,
          page,
          limit,
          pages: 1
        }
        return this.stations
      } catch (err) {
        console.error('Error fetching nursing stations:', err)
        this.error = err.response?.data?.message || 'Failed to fetch nursing stations'
        return []
      } finally {
        this.loading = false
      }
    },

    async createNursingStation(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/nursing/station', data)
        const newStation = response.data.data
        this.stations.unshift(newStation)
        return { success: true, data: newStation, message: response.data.message || 'Nursing station created' }
      } catch (err) {
        console.error('Error creating nursing station:', err)
        const message = err.response?.data?.message || err.message || 'Failed to create nursing station'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateNursingStation(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/nursing/station/${id}`, data)
        const updatedStation = response.data.data
        const idx = this.stations.findIndex(s => s._id === id)
        if (idx !== -1) {
          this.stations[idx] = updatedStation
        }
        return { success: true, data: updatedStation, message: response.data.message || 'Nursing station updated' }
      } catch (err) {
        console.error('Error updating nursing station:', err)
        const message = err.response?.data?.message || err.message || 'Failed to update nursing station'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteNursingStation(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/nursing/station/${id}`)
        this.stations = this.stations.filter(s => s._id !== id)
        return { success: true, message: response.data.message || 'Nursing station deleted' }
      } catch (err) {
        console.error('Error deleting nursing station:', err)
        const message = err.response?.data?.message || err.message || 'Failed to delete nursing station'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // New actions
    async fetchNurses() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/nursing/nurses')
        this.nurses = response.data.data || []
        return this.nurses
      } catch (err) {
        console.error('Error fetching nurses:', err)
        this.error = err.response?.data?.message || 'Failed to fetch nurses'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchAllBeds() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/ipd/beds', { params: { limit: 1000 } })
        this.allBeds = response.data.data || []
        return this.allBeds
      } catch (err) {
        console.error('Error fetching beds:', err)
        this.error = err.response?.data?.message || 'Failed to fetch beds'
        return []
      } finally {
        this.loading = false
      }
    },

    async generateStationCode() {
      try {
        const response = await api.get('/nursing/station/generate-code')
        return response.data.data?.code || ''
      } catch (err) {
        console.error('Error generating station code:', err)
        throw err
      }
    },

    async getNursingStationById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/nursing/station/${id}`)
        return response.data.data
      } catch (err) {
        console.error('Error fetching nursing station by ID:', err)
        this.error = err.response?.data?.message || 'Failed to fetch nursing station'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchAssignments(params) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/nursing/assignments', { params })
        this.assignments = response.data.data || []
        this.assignmentPagination = response.data.pagination || {
          total: this.assignments.length,
          page: params.page || 1,
          limit: params.limit || 10,
          pages: 1
        }
        return { assignments: this.assignments, pagination: this.assignmentPagination }
      } catch (err) {
        console.error('Error fetching assignments:', err)
        this.error = err.response?.data?.message || 'Failed to fetch assignments'
        return { assignments: [], pagination: this.assignmentPagination }
      } finally {
        this.loading = false
      }
    },

    async createAssignment(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/nursing/assignment', data)
        return { success: true, message: response.data.message || 'Assignment created successfully' }
      } catch (err) {
        console.error('Error creating assignment:', err)
        const message = err.response?.data?.message || err.message || 'Failed to create assignment'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

      async fetchMyStation() {
        this.loading = true
        this.error = null
        try {
          const response = await api.get('/nursing/my-station')
          this.myStation = response.data.data || null
          console.log(response.data.data);
          return this.myStation
        } catch (err) {
          console.error('Error fetching my station:', err)
          this.error = err.response?.data?.message || 'Failed to fetch my station'
          return null
        } finally {
          this.loading = false
        }
      },
    async updateAssignment(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/nursing/assignment/${id}`, data)
        return { success: true, message: response.data.message || 'Assignment updated successfully' }
      } catch (err) {
        console.error('Error updating assignment:', err)
        const message = err.response?.data?.message || err.message || 'Failed to update assignment'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteAssignment(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/nursing/assignment/${id}`)
        return { success: true, message: response.data.message || 'Assignment deleted successfully' }
      } catch (err) {
        console.error('Error deleting assignment:', err)
        const message = err.response?.data?.message || err.message || 'Failed to delete assignment'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    }
  }
})
