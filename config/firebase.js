const path = require('path');
const fs = require('fs');
const { initializeApp, getApps, getApp, cert, applicationDefault } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let appInstance = null;

function initFirebase() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
    return appInstance;
  }

  try {
    // 1. Check for service account JSON file path from environment or default location
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(__dirname, 'serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      appInstance = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully from service account file.');
      return appInstance;
    }

    // 2. Check for service account JSON string in environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      appInstance = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully from JSON env variable.');
      return appInstance;
    }

    // 3. Check for individual environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      appInstance = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      console.log('Firebase Admin initialized successfully from individual env credentials.');
      return appInstance;
    }

    // 4. Fallback: try application default credentials if explicitly configured
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      appInstance = initializeApp({
        credential: applicationDefault()
      });
      console.log('Firebase Admin initialized with application default credentials.');
      return appInstance;
    }

    console.warn('Firebase Admin: No credentials provided. Set FIREBASE_SERVICE_ACCOUNT_PATH or place serviceAccountKey.json in config/.');
    return null;
  } catch (err) {
    console.warn('Firebase Admin initialization warning:', err.message);
    return null;
  }
}

// Attempt initialization on load
initFirebase();

/**
 * Get the active Messaging service instance
 */
function getMessagingService() {
  if (!getApps().length) {
    initFirebase();
  }
  if (!getApps().length) {
    throw new Error('Firebase Admin is not initialized. Please configure credentials first.');
  }
  return getMessaging();
}

/**
 * Send push notification to a single device token
 * @param {Object} options
 * @param {string} options.token - FCM device registration token
 * @param {Object} [options.notification] - { title, body, imageUrl }
 * @param {Object} [options.data] - Key-value custom payload (strings only)
 */
async function sendToDevice({ token, notification = {}, data = {} }) {
  const messaging = getMessagingService();
  const message = {
    token,
    notification: notification.title ? notification : undefined,
    data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined
  };

  return await messaging.send(message);
}

/**
 * Send push notification to multiple device tokens
 * @param {Object} options
 * @param {string[]} options.tokens - Array of FCM device registration tokens
 * @param {Object} [options.notification] - { title, body, imageUrl }
 * @param {Object} [options.data] - Key-value custom payload (strings only)
 */
async function sendMulticast({ tokens, notification = {}, data = {} }) {
  if (!tokens || !tokens.length) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const messaging = getMessagingService();
  const message = {
    tokens,
    notification: notification.title ? notification : undefined,
    data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined
  };

  return await messaging.sendEachForMulticast(message);
}

/**
 * Send push notification to a topic
 * @param {Object} options
 * @param {string} options.topic - FCM topic name
 * @param {Object} [options.notification] - { title, body, imageUrl }
 * @param {Object} [options.data] - Key-value custom payload (strings only)
 */
async function sendToTopic({ topic, notification = {}, data = {} }) {
  const messaging = getMessagingService();
  const message = {
    topic,
    notification: notification.title ? notification : undefined,
    data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined
  };

  return await messaging.send(message);
}

module.exports = {
  initFirebase,
  getApp: () => (getApps().length ? getApp() : null),
  getMessaging: getMessagingService,
  sendToDevice,
  sendMulticast,
  sendToTopic
};
