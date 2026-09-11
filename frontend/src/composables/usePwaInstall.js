import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const isInstallable = ref(false)
const isInstalled = ref(false)
const isIOS = ref(false)

export function usePwaInstall() {
  onMounted(() => {
    // Check if already running in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      isInstalled.value = true
      isInstallable.value = false
      return
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    isIOS.value = isIosDevice

    // Listen for beforeinstallprompt event (Android, Chrome, Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      isInstallable.value = true
    })

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt.value = null
    })
  })

  const installPwa = async () => {
    if (!deferredPrompt.value) return false
    try {
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      if (outcome === 'accepted') {
        isInstalled.value = true
        isInstallable.value = false
      }
      deferredPrompt.value = null
      return outcome === 'accepted'
    } catch (err) {
      console.warn('PWA install error:', err)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    isIOS,
    installPwa
  }
}
