import { defineStore } from 'pinia'
import api from '../axios/api'

export const usePharmacyStore = defineStore('pharmacy', {
  state: () => ({
    suppliers: [],
    categories: [],
    medicines: [],
    sales: [],
    pendingIpdOrdersCount: 0,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    },
    categoryPagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    },
    medicinePagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    },
    salesPagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    }
  }),

  actions: {

    // ── Suppliers ────────────────────────────────────────────

    async fetchSuppliers(page = 1, limit = 10, search = '', isActive = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/pharmacy/suppliers', {
          params: { page, limit, search, isActive }
        })
        this.suppliers = response.data.data || []
        this.pagination = response.data.pagination || { total: 0, page, limit, pages: 1 }
        return this.suppliers
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch suppliers'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchSupplierById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/pharmacy/supplier/${id}`)
        return { success: true, data: response.data.data }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch supplier details'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createSupplier(data) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/supplier', data)
        this.suppliers.unshift(response.data.data)
        return { success: true, data: response.data.data, message: response.data.message || 'Supplier created' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create supplier'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateSupplier(id, data) {
      this.loading = true
      try {
        const response = await api.put(`/pharmacy/supplier/${id}`, data)
        const idx = this.suppliers.findIndex(s => s._id === id)
        if (idx !== -1) this.suppliers[idx] = response.data.data
        return { success: true, data: response.data.data, message: response.data.message || 'Supplier updated' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to update supplier'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteSupplier(id) {
      this.loading = true
      try {
        const response = await api.delete(`/pharmacy/supplier/${id}`)
        this.suppliers = this.suppliers.filter(s => s._id !== id)
        return { success: true, message: response.data.message || 'Supplier deleted' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to delete supplier'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ── Categories ───────────────────────────────────────────

    async fetchCategories(page = 1, limit = 10, search = '', isActive = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/pharmacy/categories', {
          params: { page, limit, search, isActive }
        })
        this.categories = response.data.data || []
        this.categoryPagination = response.data.pagination || { total: 0, page, limit, pages: 1 }
        return this.categories
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch categories'
        return []
      } finally {
        this.loading = false
      }
    },

    async createCategory(data) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/category', data)
        this.categories.unshift(response.data.data)
        return { success: true, data: response.data.data, message: response.data.message || 'Category created' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create category'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateCategory(id, data) {
      this.loading = true
      try {
        const response = await api.put(`/pharmacy/category/${id}`, data)
        const idx = this.categories.findIndex(c => c._id === id)
        if (idx !== -1) this.categories[idx] = response.data.data
        return { success: true, data: response.data.data, message: response.data.message || 'Category updated' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to update category'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteCategory(id) {
      this.loading = true
      try {
        const response = await api.delete(`/pharmacy/category/${id}`)
        this.categories = this.categories.filter(c => c._id !== id)
        return { success: true, message: response.data.message || 'Category deleted' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to delete category'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ── Medicines ────────────────────────────────────────────

    async fetchMedicines(page = 1, limit = 10, search = '', categoryId = '', supplierId = '', isActive = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/pharmacy/medicines', {
          params: { page, limit, search, categoryId, supplierId, isActive }
        })
        this.medicines = response.data.data || []
        this.medicinePagination = response.data.pagination || { total: 0, page, limit, pages: 1 }
        return this.medicines
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch medicines'
        return []
      } finally {
        this.loading = false
      }
    },

    async createMedicine(data) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/medicine', data)
        this.medicines.unshift(response.data.data)
        return { success: true, data: response.data.data, message: response.data.message || 'Medicine created successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create medicine'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateMedicine(id, data) {
      this.loading = true
      try {
        const response = await api.put(`/pharmacy/medicine/${id}`, data)
        const idx = this.medicines.findIndex(m => m._id === id)
        if (idx !== -1) this.medicines[idx] = response.data.data
        return { success: true, data: response.data.data, message: response.data.message || 'Medicine updated successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to update medicine'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteMedicine(id) {
      this.loading = true
      try {
        const response = await api.delete(`/pharmacy/medicine/${id}`)
        this.medicines = this.medicines.filter(m => m._id !== id)
        return { success: true, message: response.data.message || 'Medicine deleted successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to delete medicine'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ── Medicine Batches ─────────────────────────────────────

    async fetchBatches(medicineId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/pharmacy/medicine/${medicineId}/batches`)
        return response.data.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch medicine batches'
        return []
      } finally {
        this.loading = false
      }
    },

    async createBatch(data) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/medicine-batch', data)
        return { success: true, data: response.data.data, message: response.data.message || 'Batch created successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create batch'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async updateBatch(id, data) {
      this.loading = true
      try {
        const response = await api.put(`/pharmacy/medicine-batch/${id}`, data)
        return { success: true, data: response.data.data, message: response.data.message || 'Batch updated successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to update batch'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async deleteBatch(id) {
      this.loading = true
      try {
        const response = await api.delete(`/pharmacy/medicine-batch/${id}`)
        return { success: true, message: response.data.message || 'Batch deleted successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to delete batch'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ── Pharmacy Sales ───────────────────────────────────────

    async fetchSales(page = 1, limit = 10, search = '', additionalParams = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/pharmacy/sales', {
          params: { page, limit, search, ...additionalParams }
        })
        this.sales = response.data.data || []
        this.salesPagination = response.data.pagination || { total: 0, page, limit, pages: 1 }
        return this.sales
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch sales history'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchSaleById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/pharmacy/sale/${id}`)
        return { success: true, data: response.data.data, items: response.data.items }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch sale details'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createSale(data) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/sales', data)
        return { success: true, data: response.data.data, items: response.data.items, message: response.data.message || 'Sale processed successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to process sale'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // ── IPD Medicine Orders ──────────────────────────────────
    async fetchIpdOrdersByAdmission(admissionId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/pharmacy/ipd-orders/admission/${admissionId}`)
        return { success: true, data: response.data.data }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch IPD medicine orders'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async createIpdOrder(data) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/ipd-orders', data)
        return { success: true, data: response.data.data, items: response.data.items, message: response.data.message || 'IPD medicine order created successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create IPD medicine order'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async fetchIpdOrders(page = 1, limit = 10, search = '', status = '') {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/pharmacy/ipd-orders', {
          params: { page, limit, search, status }
        })
        return { success: true, data: response.data.data, pagination: response.data.pagination }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch IPD medicine orders'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateIpdOrderStatus(id, status) {
      this.loading = true
      try {
        const response = await api.put(`/pharmacy/ipd-orders/${id}/status`, { status })
        return { success: true, data: response.data.data, message: response.data.message || 'Order status updated successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to update order status'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async returnIpdMedicineItem(itemId, quantity, remarks) {
      this.loading = true
      try {
        const response = await api.post('/pharmacy/ipd-orders/return', { itemId, quantity, remarks })
        return { success: true, data: response.data.data, message: response.data.message || 'Medicine returned successfully' }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to return medicine'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async fetchPendingIpdOrdersCount() {
      try {
        const response = await api.get('/pharmacy/ipd-orders', {
          params: { page: 1, limit: 1, status: 'PENDING' }
        })
        this.pendingIpdOrdersCount = response.data.pagination?.total || response.data.data?.length || 0
        return this.pendingIpdOrdersCount
      } catch (err) {
        console.error('Failed to fetch pending IPD orders count', err)
        return 0
      }
    }

  }
})
