<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSnackbarStore } from '../stores/snackbarStore'

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()
const router = useRouter()

const handleLogin = async () => {
  isLoading.value = true
  
  const success = await authStore.login(email.value, password.value)
  
  isLoading.value = false
  
  if (success) {
    snackbarStore.show({
      message: 'Login successful! Welcome back.',
      type: 'success'
    })
    router.push('/dashboard')
  } else {
    snackbarStore.show({
      message: authStore.error || 'Invalid credentials',
      type: 'error'
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
    <!-- Animated Gradient Blobs Background -->
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
    <div class="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
    <div class="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

    <!-- Glassmorphic Card -->
    <div class="relative w-full max-w-md p-10 backdrop-blur-2xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(8,-11,25,0.7)] rounded-[2.5rem] z-10 mx-4 transition-all duration-300">
      
      <div class="mb-10 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-500/30">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">Welcome Back</h1>
        <p class="text-slate-400 text-sm font-medium">Please enter your credentials to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Email Field -->
        <div class="space-y-2 text-left group">
          <label for="email" class="block text-sm font-medium text-slate-300 ml-1 transition-colors group-focus-within:text-indigo-400">Email Address</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input 
              id="email" 
              v-model="email" 
              type="email" 
              required
              class="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-slate-900/70"
              placeholder="admin@hms.com"
            >
          </div>
        </div>

        <!-- Password Field -->
        <div class="space-y-2 text-left group">
          <div class="flex justify-between items-center ml-1">
            <label for="password" class="block text-sm font-medium text-slate-300 transition-colors group-focus-within:text-indigo-400">Password</label>
            <a href="#" class="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">Forgot password?</a>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <input 
              id="password" 
              v-model="password" 
              type="password" 
              required
              class="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-slate-900/70"
              placeholder="••••••••"
            >
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-3.5 px-4 mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 active:scale-[0.98] disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed flex justify-center items-center group overflow-hidden relative"
        >
          <!-- Button shimmer effect -->
          <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-shimmer rounded-2xl"></div>
          
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="isLoading" class="relative z-10">Signing in...</span>
          <span v-else class="relative z-10">Sign In</span>
        </button>
      </form>
      
      <p class="mt-8 text-center text-sm text-slate-400">
        Don't have an account? 
        <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 transition-all duration-200">Create an account</a>
      </p>
    </div>
  </div>
</template>

<style>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
</style>