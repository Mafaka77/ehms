import { defineStore } from 'pinia';
import api from '../axios/api';
import { requestFcmToken, onForegroundMessage } from '../firebase';

let pollTimer = null;

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    fcmToken: localStorage.getItem('ehms_fcm_token') || null,
    permissionStatus: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    isLoading: false,
    activeToast: null, // { id, title, body, timestamp, type }
    isDropdownOpen: false,
    lastKnownNotificationId: null
  }),

  actions: {
    /**
     * Initialize FCM listeners, register token, and start polling fallback
     */
    async init() {
      if (typeof window === 'undefined') return;

      if ('Notification' in window) {
        this.permissionStatus = Notification.permission;
      }

      // If already granted, register the device token for this logged in user
      if (this.permissionStatus === 'granted') {
        await this.registerDeviceToken();
      } else if (this.permissionStatus === 'default') {
        // Auto-request permission on dashboard load
        setTimeout(() => {
          this.requestPermissionAndToken().catch(() => {});
        }, 1500);
      }

      // Start listening for foreground push messages
      try {
        await onForegroundMessage((payload) => {
          this.handleIncomingNotification(payload);
        });
      } catch (err) {
        console.warn('Foreground push listener notice:', err);
      }

      // Initial fetch
      await this.fetchNotifications(true);

      // Start periodic sync polling (every 6 seconds) for instant cross-browser updates
      this.startPolling();
    },

    startPolling() {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          this.stopPolling();
          return;
        }
        await this.fetchNotifications(false);
      }, 6000);
    },

    stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },

    /**
     * Request browser notification permission and register FCM token
     */
    async requestPermissionAndToken() {
      try {
        this.isLoading = true;
        const token = await requestFcmToken();
        if (token) {
          this.fcmToken = token;
          this.permissionStatus = 'granted';
          localStorage.setItem('ehms_fcm_token', token);

          // Register token with backend for current user in MongoDB
          await api.post('/notifications/register-token', { token });
          return token;
        } else {
          if ('Notification' in window) {
            this.permissionStatus = Notification.permission;
          }
          return null;
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async registerDeviceToken() {
      try {
        const token = await requestFcmToken();
        if (token) {
          this.fcmToken = token;
          localStorage.setItem('ehms_fcm_token', token);
          await api.post('/notifications/register-token', { token }).catch(() => {});
        }
      } catch (err) {
        console.warn('Token registration skipped:', err.message);
      }
    },

    /**
     * Fetch existing notifications from backend
     */
    async fetchNotifications(isInitial = false) {
      try {
        const res = await api.get('/notifications');
        if (res.data) {
          const freshNotifications = res.data.notifications || [];
          const freshUnreadCount = res.data.unreadCount || 0;

          // Detect new incoming notifications during polling
          if (!isInitial && freshNotifications.length > 0) {
            const newest = freshNotifications[0];
            if (this.lastKnownNotificationId && newest._id !== this.lastKnownNotificationId && !newest.isRead) {
              // Found a new notification from another session
              this.handleIncomingNotification({
                notification: {
                  title: newest.title,
                  body: newest.body
                },
                data: {
                  type: newest.type,
                  notificationId: newest._id,
                  ...newest.data
                }
              });
            }
          }

          this.notifications = freshNotifications;
          this.unreadCount = freshUnreadCount;
          if (freshNotifications.length > 0) {
            this.lastKnownNotificationId = freshNotifications[0]._id;
          }
        }
      } catch (err) {
        // quiet catch during polling
      }
    },

    /**
     * Handle new incoming push notification in foreground
     */
    handleIncomingNotification(payload) {
      const title = payload.notification?.title || payload.data?.title || 'EHMS Notification';
      const body = payload.notification?.body || payload.data?.body || '';
      const type = payload.data?.type || 'GENERAL';
      const id = payload.data?.notificationId || Date.now().toString();

      // Check if already in list
      const existing = this.notifications.find(n => n._id === id);
      if (!existing) {
        const newNotif = {
          _id: id,
          title,
          body,
          type,
          createdAt: new Date().toISOString(),
          isRead: false
        };
        this.notifications.unshift(newNotif);
        this.unreadCount += 1;
        this.lastKnownNotificationId = id;
      }

      // Trigger floating banner/toast
      this.showToast({
        id,
        title,
        body,
        type
      });

      // Play subtle chime sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
    },

    showToast(toast) {
      this.activeToast = toast;
      setTimeout(() => {
        if (this.activeToast?.id === toast.id) {
          this.activeToast = null;
        }
      }, 7000);
    },

    dismissToast() {
      this.activeToast = null;
    },

    /**
     * Mark single notification as read
     */
    async markAsRead(id) {
      const item = this.notifications.find(n => n._id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        if (this.unreadCount > 0) this.unreadCount--;
      }
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch (err) {
        console.warn('Mark as read error:', err.message);
      }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
      this.notifications.forEach(n => (n.isRead = true));
      this.unreadCount = 0;
      try {
        await api.post('/notifications/read-all');
      } catch (err) {
        console.warn('Mark all as read error:', err.message);
      }
    },

    /**
     * Trigger a test push notification from backend
     */
    async triggerTestPush() {
      try {
        this.isLoading = true;
        const res = await api.post('/notifications/test', {
          token: this.fcmToken
        });
        return res.data;
      } catch (err) {
        console.error('Trigger test push error:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
