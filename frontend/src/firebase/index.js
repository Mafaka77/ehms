import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBmhaJAARxrFafZztQiQLqp9QlVpVZQdZE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ehms-c37a6.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ehms-c37a6',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ehms-c37a6.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '206575333313',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:206575333313:web:397f1ab96553a374550940'
};

// Initialize or reuse Firebase App safely
export function getFirebaseApp() {
  try {
    const apps = getApps();
    if (apps.length > 0) return apps[0];
    return initializeApp(firebaseConfig);
  } catch (e) {
    console.warn('Firebase initializeApp warning:', e.message);
    return null;
  }
}

export const app = getFirebaseApp();

let messagingInstance = null;

/**
 * Get or initialize Firebase Messaging instance safely
 */
export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      const fbApp = getFirebaseApp();
      if (fbApp) {
        messagingInstance = getMessaging(fbApp);
        return messagingInstance;
      }
    }
  } catch (err) {
    console.warn('Firebase Messaging not supported or blocked in this browser:', err.message);
  }
  return null;
}

/**
 * Request notification permissions and generate FCM registration token
 * @param {string} [vapidKey] - Web Push certificate key (defaults to VITE_FIREBASE_VAPID_KEY)
 * @returns {Promise<string|null>} FCM device token or null if denied/unsupported
 */
export async function requestFcmToken(vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    let registration;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('Service worker registration notice:', swErr.message);
      }
    }

    const tokenOptions = {
      serviceWorkerRegistration: registration
    };

    if (vapidKey && typeof vapidKey === 'string' && vapidKey.trim()) {
      tokenOptions.vapidKey = vapidKey.trim();
    }

    const currentToken = await getToken(messaging, tokenOptions);
    return currentToken || null;
  } catch (err) {
    console.warn('FCM token request skipped/failed in this browser:', err.message);
    return null;
  }
}

/**
 * Listen for push notifications when the app is in the foreground
 * @param {Function} callback - Handler function receiving payload { notification, data }
 * @returns {Promise<Function|null>} Unsubscribe function or null
 */
export async function onForegroundMessage(callback) {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;
    return onMessage(messaging, (payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    });
  } catch (err) {
    console.warn('onForegroundMessage setup skipped:', err.message);
    return null;
  }
}

export default app;
