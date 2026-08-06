import { defineStore } from 'pinia'
import api from '../axios/api'

export const useEndoscopyStore = defineStore('endoscopy', {
    state: () => ({
        categories: [],
        loading: false,
        error: null,
        searchQuery: '',
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        },
        // Orders
        orders: [],
        orderPagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        }
    }),

    actions: {
        // --- Endoscopy Categories ---
        async fetchCategories(page = 1, limit = 10, search = '') {
            this.loading = true
            this.error = null
            try {
                const response = await api.get('/endoscopy/category', {
                    params: { page, limit, search }
                })
                this.categories = response.data.data
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                }
            } catch (error) {
                console.error('Error fetching endoscopy categories:', error)
                this.error = error.response?.data?.message || 'Failed to fetch endoscopy categories'
            } finally {
                this.loading = false
            }
        },

        async createCategory(categoryData) {
            this.loading = true
            try {
                const response = await api.post('/endoscopy/category', categoryData)
                return { success: true, message: response.data.message, data: response.data.data }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create endoscopy category'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async updateCategory(id, categoryData) {
            this.loading = true
            try {
                const response = await api.put(`/endoscopy/category/${id}`, categoryData)
                const index = this.categories.findIndex(cat => cat._id === id)
                if (index !== -1) {
                    this.categories[index] = response.data.data
                }
                return { success: true, message: response.data.message || 'Endoscopy category updated successfully', data: response.data.data }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update endoscopy category'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async deleteCategory(id) {
            this.loading = true
            try {
                const response = await api.delete(`/endoscopy/category/${id}`)
                this.categories = this.categories.filter(cat => cat._id !== id)
                return { success: true, message: response.data.message || 'Endoscopy category deleted successfully' }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete endoscopy category'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async getCategoryById(id) {
            this.loading = true
            try {
                const response = await api.get(`/endoscopy/category/${id}`)
                return response.data.data
            } catch (error) {
                console.error('Error fetching endoscopy category:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        // --- Endoscopy Tests ---
        async fetchTests(categoryId, page = 1, limit = 20, search = '') {
            this.loading = true
            this.error = null
            try {
                const response = await api.get('/endoscopy/test', {
                    params: { categoryId, page, limit, search }
                })
                return { data: response.data.data, pagination: response.data.pagination }
            } catch (error) {
                console.error('Error fetching endoscopy tests:', error)
                this.error = error.response?.data?.message || 'Failed to fetch endoscopy tests'
                return { data: [], pagination: {} }
            } finally {
                this.loading = false
            }
        },

        async createTest(testData) {
            this.loading = true
            try {
                const response = await api.post('/endoscopy/test', testData)
                return { success: true, message: response.data.message, data: response.data.data }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create endoscopy test'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async updateTest(id, testData) {
            this.loading = true
            try {
                const response = await api.put(`/endoscopy/test/${id}`, testData)
                return { success: true, message: response.data.message || 'Test updated successfully', data: response.data.data }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update endoscopy test'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async deleteTest(id) {
            this.loading = true
            try {
                const response = await api.delete(`/endoscopy/test/${id}`)
                return { success: true, message: response.data.message || 'Test deleted successfully' }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete endoscopy test'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        // --- Endoscopy Orders ---
        async fetchOrders(page = 1, limit = 10, search = '', paymentStatus = '', additionalParams = {}) {
            this.loading = true
            this.error = null
            try {
                const response = await api.get('/endoscopy/order', {
                    params: { page, limit, search, paymentStatus, ...additionalParams }
                })
                this.orders = response.data.data
                this.orderPagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                }
            } catch (error) {
                console.error('Error fetching endoscopy orders:', error)
                this.error = error.response?.data?.message || 'Failed to fetch endoscopy orders'
            } finally {
                this.loading = false
            }
        },

        async createOrder(orderData) {
            this.loading = true
            try {
                const response = await api.post('/endoscopy/order', orderData)
                return { success: true, message: response.data.message, data: response.data.data }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create endoscopy order'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async updateOrder(id, orderData) {
            this.loading = true
            try {
                const response = await api.put(`/endoscopy/order/${id}`, orderData)
                return { success: true, message: response.data.message || 'Endoscopy order updated successfully', data: response.data.data }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update endoscopy order'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async deleteOrder(id) {
            this.loading = true
            try {
                const response = await api.delete(`/endoscopy/order/${id}`)
                this.orders = this.orders.filter(ord => ord._id !== id)
                return { success: true, message: response.data.message || 'Endoscopy order deleted successfully' }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete endoscopy order'
                return { success: false, message }
            } finally {
                this.loading = false
            }
        },

        async getOrderById(id) {
            this.loading = true
            try {
                const response = await api.get(`/endoscopy/order/${id}`)
                return { order: response.data.data.order || response.data.data, items: response.data.data.items || response.data.items || [] }
            } catch (error) {
                console.error('Error fetching endoscopy order:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        // --- Endoscopy Billing & Payments ---
        async fetchBillDetails(billId) {
            this.loading = true
            this.error = null
            try {
                const response = await api.get(`/billing/bills/${billId}`)
                return response.data.data
            } catch (error) {
                console.error('Error fetching bill details:', error)
                this.error = error.response?.data?.message || 'Failed to fetch bill details'
                throw error
            } finally {
                this.loading = false
            }
        },

        async generateBill(payload) {
            this.loading = true
            this.error = null
            try {
                const response = await api.post('/billing/generate-from-endoscopy-order', payload)
                return response.data.data
            } catch (error) {
                console.error('Error generating bill:', error)
                this.error = error.response?.data?.message || 'Failed to generate bill'
                throw error
            } finally {
                this.loading = false
            }
        },

        async processPayment(billId, paymentData) {
            this.loading = true
            this.error = null
            try {
                const response = await api.post(`/billing/bills/${billId}/pay`, paymentData)
                return response.data.data
            } catch (error) {
                console.error('Error processing payment:', error)
                this.error = error.response?.data?.message || 'Failed to process payment'
                throw error
            } finally {
                this.loading = false
            }
        },

        async cancelBill(billId) {
            this.loading = true
            this.error = null
            try {
                const response = await api.post(`/billing/bills/${billId}/cancel`)
                return response.data
            } catch (error) {
                console.error('Error cancelling bill:', error)
                this.error = error.response?.data?.message || 'Failed to cancel bill'
                throw error
            } finally {
                this.loading = false
            }
        },

        async cancelPayment(paymentId) {
            this.loading = true
            this.error = null
            try {
                const response = await api.post(`/billing/payments/${paymentId}/cancel`)
                return response.data.data
            } catch (error) {
                console.error('Error cancelling payment:', error)
                this.error = error.response?.data?.message || 'Failed to cancel payment'
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})
