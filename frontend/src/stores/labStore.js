import { defineStore } from "pinia";
import api from '../axios/api';

export const useLabStore = defineStore('lab', {
    state: () => ({
        categories: [],
        sampleTypes: [],
        categories: [],
        sampleTypes: [],
        tests: [],
        testParameters: [],
        orders: [],
        stats: {
            totalTests: 0,
            pendingOrders: 0,
            completedOrders: 0,
            revenue: 0
        },
        loading: false,
        error: null,
        searchQuery: '',
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        },
        sampleTypePagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        },
        testPagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        },
        testParameterPagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        },
        orderPagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1
        }
    }),
    
    actions: {
        async fetchCategories(page = 1, limit = 10, search = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/lab/category', {
                    params: { page, limit, search }
                });
                this.categories = response.data.data;
                this.pagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching lab categories:', error);
                this.error = error.response?.data?.message || 'Failed to fetch lab categories';
            } finally {
                this.loading = false;
            }
        },
        
        async createCategory(categoryData) {
            this.loading = true;
            try {
                const response = await api.post('/lab/category', categoryData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create lab category';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteCategory(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/lab/category/${id}`);
                this.categories = this.categories.filter(cat => cat._id !== id);
                return { success: true, message: response.data.message || 'Lab category deleted successfully' };
            } catch (error) {
                console.error('Error deleting lab category:', error);
                const message = error.response?.data?.message || error.message || 'Failed to delete lab category';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateCategory(id, categoryData) {
            this.loading = true;
            try {
                const response = await api.put(`/lab/category/${id}`, categoryData);
                const index = this.categories.findIndex(cat => cat._id === id);
                if (index !== -1) {
                    this.categories[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Lab category updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update lab category';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        // --- Sample Types ---
        async fetchSampleTypes(page = 1, limit = 10, search = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/lab/sample-type', {
                    params: { page, limit, search }
                });
                this.sampleTypes = response.data.data;
                this.sampleTypePagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching sample types:', error);
                this.error = error.response?.data?.message || 'Failed to fetch sample types';
            } finally {
                this.loading = false;
            }
        },
        
        async createSampleType(sampleTypeData) {
            this.loading = true;
            try {
                const response = await api.post('/lab/sample-type', sampleTypeData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create sample type';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteSampleType(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/lab/sample-type/${id}`);
                this.sampleTypes = this.sampleTypes.filter(type => type._id !== id);
                return { success: true, message: response.data.message || 'Sample type deleted successfully' };
            } catch (error) {
                console.error('Error deleting sample type:', error);
                const message = error.response?.data?.message || error.message || 'Failed to delete sample type';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateSampleType(id, sampleTypeData) {
            this.loading = true;
            try {
                const response = await api.put(`/lab/sample-type/${id}`, sampleTypeData);
                const index = this.sampleTypes.findIndex(type => type._id === id);
                if (index !== -1) {
                    this.sampleTypes[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Sample type updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update sample type';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        // --- Lab Tests ---
        async fetchTests(page = 1, limit = 10, search = '', sampleTypeId = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/lab/test', {
                    params: { page, limit, search, sampleTypeId }
                });
                this.tests = response.data.data;
                this.testPagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching tests:', error);
                this.error = error.response?.data?.message || 'Failed to fetch tests';
            } finally {
                this.loading = false;
            }
        },
        
        async createTest(testData) {
            this.loading = true;
            try {
                const response = await api.post('/lab/test', testData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create test';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteTest(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/lab/test/${id}`);
                this.tests = this.tests.filter(test => test._id !== id);
                return { success: true, message: response.data.message || 'Test deleted successfully' };
            } catch (error) {
                console.error('Error deleting test:', error);
                const message = error.response?.data?.message || error.message || 'Failed to delete test';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateTest(id, testData) {
            this.loading = true;
            try {
                const response = await api.put(`/lab/test/${id}`, testData);
                const index = this.tests.findIndex(test => test._id === id);
                if (index !== -1) {
                    this.tests[index] = response.data.data;
                }
                return { success: true, message: response.data.message || 'Test updated successfully', data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update test';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        // --- Lab Test Parameters ---
        async fetchTestParameters(page = 1, limit = 10, search = '', testId = '') {
            this.loading = true;
            this.error = null;   
            try {
                const response = await api.get('/lab/test-parameter', {
                    params: { page, limit, search, testId }
                });
                this.testParameters = response.data.data;
                this.testParameterPagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching test parameters:', error);
                this.error = error.response?.data?.message || 'Failed to fetch test parameters';
            } finally {
                this.loading = false;
            }
        },
        
        async createTestParameter(paramData) {
            this.loading = true;
            try {
                const response = await api.post('/lab/test-parameter', paramData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create test parameter';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async updateTestParameter(id, paramData) {
            this.loading = true;
            try {
                const response = await api.put(`/lab/test-parameter/${id}`, paramData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update test parameter';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteTestParameter(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/lab/test-parameter/${id}`);
                return { success: true, message: response.data.message };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete test parameter';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        // --- Lab Orders ---
        async fetchOrders(page = 1, limit = 10, search = '', paymentStatus = '', additionalParams = {}) {
            this.loading = true;
            this.error = null;
            try {
                const params = { page, limit, search, ...additionalParams }
                if (paymentStatus) {
                    params.paymentStatus = paymentStatus
                }
                const response = await api.get('/lab/order', { params });
                this.orders = response.data.data;
                this.orderPagination = response.data.pagination || {
                    total: response.data.data.length,
                    page,
                    limit,
                    pages: 1
                };
            } catch (error) {
                console.error('Error fetching orders:', error);
                this.error = error.response?.data?.message || 'Failed to fetch orders';
            } finally {
                this.loading = false;
            }
        },

        async createOrder(orderData) {
            this.loading = true;
            try {
                const response = await api.post('/lab/order', orderData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to create order';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async getOrderById(id) {
            this.loading = true;
            try {
                const response = await api.get(`/lab/order/${id}`);
                return response.data.data;
            } catch (error) {
                console.error('Error fetching order:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateOrder(id, orderData) {
            this.loading = true;
            try {
                const response = await api.put(`/lab/order/${id}`, orderData);
                return { success: true, message: response.data.message, data: response.data.data };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to update order';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        async deleteOrder(id) {
            this.loading = true;
            try {
                const response = await api.delete(`/lab/order/${id}`);
                this.orders = this.orders.filter(o => o._id !== id);
                return { success: true, message: response.data.message };
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to delete order';
                return { success: false, message };
            } finally {
                this.loading = false;
            }
        },

        // --- Lab Billing & Payments ---
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
                const response = await api.post('/billing/generate-from-lab-order', payload);
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

        async fetchStats() {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get('/lab/stats');
                this.stats = response.data.data;
                return response.data.data;
            } catch (error) {
                console.error('Error fetching lab stats:', error);
                this.error = error.response?.data?.message || 'Failed to fetch lab stats';
            } finally {
                this.loading = false;
            }
        },

        async fetchOrderResults(orderId) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get(`/lab/order/${orderId}/results`);
                return response.data.data;
            } catch (error) {
                console.error('Error fetching order results:', error);
                this.error = error.response?.data?.message || 'Failed to fetch order results';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async saveOrderResults(orderId, resultsData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post(`/lab/order/${orderId}/results`, { results: resultsData });
                return response.data.data;
            } catch (error) {
                console.error('Error saving order results:', error);
                this.error = error.response?.data?.message || 'Failed to save order results';
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
