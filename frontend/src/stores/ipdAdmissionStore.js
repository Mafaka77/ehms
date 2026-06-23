import { defineStore } from 'pinia'
import api from '../axios/api'

export const useIpdAdmissionStore = defineStore('ipdAdmission', {
  state: () => ({
    admissions: [],
    pagination: { total: 0, page: 1, limit: 10, pages: 1 },
    loading: false,
    error: null
  }),

  actions: {
    async fetchAdmissions(filters = {}) {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        params.append('page', filters.page || 1)
        params.append('limit', filters.limit || 10)
        
        if (filters.status) params.append('status', filters.status)
        if (filters.consultantDoctorId) params.append('consultantDoctorId', filters.consultantDoctorId)
        if (filters.date) params.append('date', filters.date)
        if (filters.search) params.append('search', filters.search)
        if (filters.nursingStationId) params.append('nursingStationId', filters.nursingStationId)

        const response = await api.get(`/ipd/admissions?${params.toString()}`)
        this.admissions = response.data.data
        this.pagination = response.data.pagination
        return { success: true }
      } catch (err) {
        console.error('Error fetching admissions:', err)
        this.error = err.response?.data?.message || 'Failed to fetch admissions'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createAdmission(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/ipd/admission', data)
        const newAdmission = response.data.data
        this.admissions.unshift(newAdmission)
        return { success: true, data: newAdmission, message: response.data.message || 'Patient admitted successfully' }
      } catch (err) {
        console.error('Error creating admission:', err)
        this.error = err.response?.data?.message || 'Failed to admit patient'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateAdmission(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/admission/${id}`, data)
        const updatedAdmission = response.data.data
        const idx = this.admissions.findIndex(a => a._id === id)
        if (idx !== -1) {
          this.admissions[idx] = updatedAdmission
        }
        return { success: true, data: updatedAdmission, message: response.data.message || 'Admission updated successfully' }
      } catch (err) {
        console.error('Error updating admission:', err)
        this.error = err.response?.data?.message || 'Failed to update admission'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async getAdmissionById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/admission/${id}`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching admission details:', err)
        this.error = err.response?.data?.message || 'Failed to fetch admission details'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchAdmissionBedHistory(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/admission/${id}/bed-history`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching bed history:', err)
        this.error = err.response?.data?.message || 'Failed to fetch bed history'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateAdmissionBedHistory(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/admission/bed-history/${id}`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Bed history updated successfully' }
      } catch (err) {
        console.error('Error updating bed history:', err)
        this.error = err.response?.data?.message || 'Failed to update bed history'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteAdmission(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/admission/${id}`)
        this.admissions = this.admissions.filter(a => a._id !== id)
        return { success: true, message: response.data.message || 'Admission deleted successfully' }
      } catch (err) {
        console.error('Error deleting admission:', err)
        this.error = err.response?.data?.message || 'Failed to delete admission'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchAdmissionCharges(admissionId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/admission/${admissionId}/charges`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching patient charges:', err)
        this.error = err.response?.data?.message || 'Failed to fetch patient charges'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async addAdmissionCharge(admissionId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(`/ipd/admission/${admissionId}/charge`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Charge added successfully' }
      } catch (err) {
        console.error('Error adding patient charge:', err)
        this.error = err.response?.data?.message || 'Failed to add patient charge'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteAdmissionCharge(chargeId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/admission/charge/${chargeId}`)
        return { success: true, message: response.data.message || 'Charge deleted successfully' }
      } catch (err) {
        console.error('Error deleting patient charge:', err)
        this.error = err.response?.data?.message || 'Failed to delete patient charge'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateAdmissionCharge(chargeId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/admission/charge/${chargeId}`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Charge updated successfully' }
      } catch (err) {
        console.error('Error updating patient charge:', err)
        this.error = err.response?.data?.message || 'Failed to update patient charge'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchChargeCategories() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/ipd/charge-categories')
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching charge categories:', err)
        this.error = err.response?.data?.message || 'Failed to fetch charge categories'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchChargeCategoryById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/charge-categories/${id}`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching charge category details:', err)
        this.error = err.response?.data?.message || 'Failed to fetch charge category'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createChargeCategory(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/ipd/charge-categories', data)
        return { success: true, data: response.data.data, message: response.data.message || 'Charge category created successfully' }
      } catch (err) {
        console.error('Error creating charge category:', err)
        this.error = err.response?.data?.message || 'Failed to create charge category'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteChargeCategory(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/charge-categories/${id}`)
        return { success: true, message: response.data.message || 'Charge category deleted successfully' }
      } catch (err) {
        console.error('Error deleting charge category:', err)
        this.error = err.response?.data?.message || 'Failed to delete charge category'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },


    async fetchChargeMasters(categoryId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/charge-categories/${categoryId}/charge-masters`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching charge masters:', err)
        this.error = err.response?.data?.message || 'Failed to fetch charge masters'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createChargeMaster(categoryId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(`/ipd/charge-categories/${categoryId}/charge-masters`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Charge master created successfully' }
      } catch (err) {
        console.error('Error creating charge master:', err)
        this.error = err.response?.data?.message || 'Failed to create charge master'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateChargeMaster(chargeMasterId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/ipd/charge-masters/${chargeMasterId}`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Charge master updated successfully' }
      } catch (err) {
        console.error('Error updating charge master:', err)
        this.error = err.response?.data?.message || 'Failed to update charge master'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchPackageItems(chargeMasterId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/charge-masters/${chargeMasterId}/package-items`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching package items:', err)
        this.error = err.response?.data?.message || 'Failed to fetch package items'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async addPackageItem(chargeMasterId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(`/ipd/charge-masters/${chargeMasterId}/package-items`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Package item added successfully' }
      } catch (err) {
        console.error('Error adding package item:', err)
        this.error = err.response?.data?.message || 'Failed to add package item'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async deletePackageItem(itemId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/package-items/${itemId}`)
        return { success: true, message: response.data.message || 'Package item deleted successfully' }
      } catch (err) {
        console.error('Error deleting package item:', err)
        this.error = err.response?.data?.message || 'Failed to delete package item'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteChargeMaster(chargeMasterId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/charge-masters/${chargeMasterId}`)
        return { success: true, message: response.data.message || 'Charge master deleted successfully' }
      } catch (err) {
        console.error('Error deleting charge master:', err)
        this.error = err.response?.data?.message || 'Failed to delete charge master'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchAdmissionFiles(admissionId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/admission/${admissionId}/files`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching patient files:', err)
        this.error = err.response?.data?.message || 'Failed to fetch patient files'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async uploadAdmissionFile(admissionId, formData) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(`/ipd/admission/${admissionId}/files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return { success: true, data: response.data.data, message: response.data.message || 'File uploaded successfully' }
      } catch (err) {
        console.error('Error uploading patient file:', err)
        this.error = err.response?.data?.message || 'Failed to upload patient file'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteAdmissionFile(fileId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/ipd/admission/files/${fileId}`)
        return { success: true, message: response.data.message || 'File deleted successfully' }
      } catch (err) {
        console.error('Error deleting patient file:', err)
        this.error = err.response?.data?.message || 'Failed to delete patient file'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchAdmissionNotes(admissionId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/ipd/admission/${admissionId}/notes`)
        return { success: true, data: response.data.data }
      } catch (err) {
        console.error('Error fetching clinical notes:', err)
        this.error = err.response?.data?.message || 'Failed to fetch clinical notes'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createAdmissionNote(admissionId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(`/ipd/admission/${admissionId}/notes`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Clinical note added successfully' }
      } catch (err) {
        console.error('Error adding clinical note:', err)
        this.error = err.response?.data?.message || 'Failed to add clinical note'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

