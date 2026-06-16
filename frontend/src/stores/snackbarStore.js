import { defineStore } from 'pinia';

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    isVisible: false,
    message: '',
    type: 'success', // 'success', 'error', 'warning', 'info'
    timeout: 3000,
    timerId: null,
  }),
  actions: {
    show({ message, type = 'success', timeout = 4000 }) {
      this.message = message;
      this.type = type;
      this.timeout = timeout;
      this.isVisible = true;

      // Clear any existing timer so it doesn't close prematurely if called rapidly
      if (this.timerId) {
        clearTimeout(this.timerId);
      }

      // Auto-hide the snackbar after the specified timeout
      if (timeout > 0) {
        this.timerId = setTimeout(() => {
          this.close();
        }, timeout);
      }
    },
    close() {
      this.isVisible = false;
    }
  }
});
