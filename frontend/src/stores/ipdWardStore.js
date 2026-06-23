import { defineStore } from 'pinia'
import api from '../axios/api'

export const useIpdWardStore = defineStore('ipdWard', {
  state: () => ({
    wards: [],
    rooms: [],
    beds: [],
    currentWard: null,
    currentRoom: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    }
  }),

  actions: {
    // ==========================================
    // Ward Actions
    // ==========================================
    async fetchWards(page = 1, limit = 100, search = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/ipd/wards', {
          params: { page, limit, search }
        })
        this.wards = response.data.data
        this.pagination = response.data.pagination || {
          total: response.data.data.length,
          page,
          limit,
          pages: 1
        }
        return this.wards
      } catch (err) {
        console.error('Error fetching wards:', err)
        this.error = err.response?.data?.message || 'Failed to fetch wards'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchWardById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/ward/${id}`)
        this.currentWard = response.data.data
        return this.currentWard
      } catch (err) {
        console.error('Error fetching ward by id:', err)
        this.error = err.response?.data?.message || 'Failed to fetch ward details'
        return null
      } finally {
        this.loading = false
      }
    },

    async createWard(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/ipd/ward', data)
        const newWard = response.data.data
        this.wards.unshift(newWard)
        return { success: true, data: newWard, message: response.data.message || 'Ward created successfully' }
      } catch (err) {
        console.error('Error creating ward:', err)
        const message = err.response?.data?.message || err.message || 'Failed to create ward'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateWard(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/ward/${id}`, data)
        const updatedWard = response.data.data
        const idx = this.wards.findIndex(w => w._id === id)
        if (idx !== -1) {
          this.wards[idx] = updatedWard
        }
        if (this.currentWard && this.currentWard._id === id) {
          this.currentWard = updatedWard
        }
        return { success: true, data: updatedWard, message: response.data.message || 'Ward updated successfully' }
      } catch (err) {
        console.error('Error updating ward:', err)
        const message = err.response?.data?.message || err.message || 'Failed to update ward'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteWard(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/ward/${id}`)
        this.wards = this.wards.filter(w => w._id !== id)
        return { success: true, message: response.data.message || 'Ward deleted successfully' }
      } catch (err) {
        console.error('Error deleting ward:', err)
        const message = err.response?.data?.message || err.message || 'Failed to delete ward'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ==========================================
    // Room Actions
    // ==========================================
    async fetchRooms(wardId = '', search = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/ipd/rooms', {
          params: { wardId, search }
        })
        this.rooms = response.data.data
        return this.rooms
      } catch (err) {
        console.error('Error fetching rooms:', err)
        this.error = err.response?.data?.message || 'Failed to fetch rooms'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchRoomById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/room/${id}`)
        this.currentRoom = response.data.data
        return this.currentRoom
      } catch (err) {
        console.error('Error fetching room by id:', err)
        this.error = err.response?.data?.message || 'Failed to fetch room details'
        return null
      } finally {
        this.loading = false
      }
    },

    async createRoom(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/ipd/room', data)
        const newRoom = response.data.data
        this.rooms.push(newRoom)
        return { success: true, data: newRoom, message: response.data.message || 'Room created successfully' }
      } catch (err) {
        console.error('Error creating room:', err)
        const message = err.response?.data?.message || err.message || 'Failed to create room'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateRoom(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/room/${id}`, data)
        const updatedRoom = response.data.data
        const idx = this.rooms.findIndex(r => r._id === id)
        if (idx !== -1) {
          this.rooms[idx] = updatedRoom
        }
        return { success: true, data: updatedRoom, message: response.data.message || 'Room updated successfully' }
      } catch (err) {
        console.error('Error updating room:', err)
        const message = err.response?.data?.message || err.message || 'Failed to update room'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteRoom(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/room/${id}`)
        this.rooms = this.rooms.filter(r => r._id !== id)
        return { success: true, message: response.data.message || 'Room deleted successfully' }
      } catch (err) {
        console.error('Error deleting room:', err)
        const message = err.response?.data?.message || err.message || 'Failed to delete room'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ==========================================
    // Bed Actions
    // ==========================================
    async fetchBeds(wardId = '', status = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/ipd/beds', {
          params: { wardId, status }
        })
        this.beds = response.data.data
        return this.beds
      } catch (err) {
        console.error('Error fetching beds:', err)
        this.error = err.response?.data?.message || 'Failed to fetch beds'
        return []
      } finally {
        this.loading = false
      }
    },

    async createBed(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/ipd/bed', data)
        const newBed = response.data.data
        this.beds.push(newBed)
        return { success: true, data: newBed, message: response.data.message || 'Bed created successfully' }
      } catch (err) {
        console.error('Error creating bed:', err)
        const message = err.response?.data?.message || err.message || 'Failed to create bed'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateBed(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/bed/${id}`, data)
        const updatedBed = response.data.data
        const idx = this.beds.findIndex(b => b._id === id)
        if (idx !== -1) {
          this.beds[idx] = updatedBed
        }
        return { success: true, data: updatedBed, message: response.data.message || 'Bed updated successfully' }
      } catch (err) {
        console.error('Error updating bed:', err)
        const message = err.response?.data?.message || err.message || 'Failed to update bed'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteBed(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/bed/${id}`)
        this.beds = this.beds.filter(b => b._id !== id)
        return { success: true, message: response.data.message || 'Bed deleted successfully' }
      } catch (err) {
        console.error('Error deleting bed:', err)
        const message = err.response?.data?.message || err.message || 'Failed to delete bed'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    }
  }
})
