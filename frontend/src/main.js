import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { createPinia } from 'pinia'
const app = createApp(App)

app.use(router)
app.use(createPinia())
app.mount('#app')

// Register PWA / Firebase Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
      console.warn('PWA service worker registration notice:', err);
    });
  });
}
