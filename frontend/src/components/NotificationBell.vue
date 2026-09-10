<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';
import { DateTime } from 'luxon';

const notifStore = useNotificationStore();
const isOpen = ref(false);
const dropdownRef = ref(null);
const isTesting = ref(false);
const testSuccessMsg = ref('');
const isMarkingAll = ref(false);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    notifStore.fetchNotifications();
  }
}

function closeDropdown(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown);
  notifStore.init();
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

async function handleEnablePush() {
  await notifStore.requestPermissionAndToken();
}

async function handleMarkAllAsRead() {
  try {
    isMarkingAll.value = true;
    await notifStore.markAllAsRead();
  } finally {
    isMarkingAll.value = false;
  }
}

async function handleTestNotification() {
  try {
    isTesting.value = true;
    testSuccessMsg.value = '';
    await notifStore.triggerTestPush();
    testSuccessMsg.value = 'Push dispatched!';
    setTimeout(() => {
      testSuccessMsg.value = '';
    }, 3000);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to send test push');
  } finally {
    isTesting.value = false;
  }
}

function formatTime(isoString) {
  if (!isoString) return '';
  const dt = DateTime.fromISO(isoString);
  if (!dt.isValid) return '';
  return dt.toRelative() || dt.toFormat('hh:mm a');
}

function getTypeIcon(type) {
  switch (type) {
    case 'PHARMACY_ORDER':
    case 'PHARMACY_RETURN':
    case 'PHARMACY_INDENT':
      return { icon: '💊', bg: 'bg-teal-100 text-teal-600' };
    case 'PHARMACY_DISPENSED':
      return { icon: '📦', bg: 'bg-emerald-100 text-emerald-600' };
    case 'PHARMACY_CANCELLED':
      return { icon: '❌', bg: 'bg-rose-100 text-rose-600' };
    case 'EMERGENCY':
      return { icon: '🚨', bg: 'bg-rose-100 text-rose-600' };
    case 'APPOINTMENT':
    case 'OPD':
      return { icon: '📅', bg: 'bg-indigo-100 text-indigo-600' };
    case 'ADMISSION':
      return { icon: '🏥', bg: 'bg-blue-100 text-blue-600' };
    case 'LAB':
    case 'LAB_ORDER':
    case 'LAB_REQUEST':
    case 'LAB_RESULT':
      return { icon: '🧪', bg: 'bg-emerald-100 text-emerald-600' };
    case 'RADIOLOGY':
      return { icon: '🩻', bg: 'bg-purple-100 text-purple-600' };
    default:
      return { icon: '🔔', bg: 'bg-slate-100 text-slate-600' };
  }
}
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Bell Button -->
    <button
      @click="toggleDropdown"
      class="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
      :class="{ 'bg-slate-100 text-indigo-600': isOpen }"
      title="Notifications"
    >
      <!-- Pulse ping when unread > 0 -->
      <span
        v-if="notifStore.unreadCount > 0"
        class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"
      ></span>
      <span
        v-if="notifStore.unreadCount > 0"
        class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full"
      ></span>

      <!-- Unread count badge -->
      <span
        v-if="notifStore.unreadCount > 0"
        class="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
      >
        {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
      </span>

      <!-- Bell Icon SVG -->
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    </button>

    <!-- Dropdown Modal -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95 -translate-y-2"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col max-h-[550px]"
      >
        <!-- Header -->
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-800 text-base">Notifications</h3>
            <span
              v-if="notifStore.unreadCount > 0"
              class="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-2xs"
            >
              {{ notifStore.unreadCount }} new
            </span>
          </div>

          <!-- Mark All As Read Button -->
          <button
            v-if="notifStore.notifications.length > 0 && notifStore.unreadCount > 0"
            @click="handleMarkAllAsRead"
            :disabled="isMarkingAll"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/80 active:scale-95 rounded-lg border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
            title="Mark all notifications as read"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ isMarkingAll ? 'Marking...' : 'Mark all as read' }}</span>
          </button>
          <span v-else-if="notifStore.notifications.length > 0" class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            All read
          </span>
        </div>

        <!-- Permission Prompt Banner (if not granted) -->
        <div
          v-if="notifStore.permissionStatus !== 'granted'"
          class="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-lg">🔔</span>
            <div class="text-xs text-amber-800 truncate">
              <span class="font-semibold block">Enable Browser Push</span>
              Get notified of admissions & orders
            </div>
          </div>
          <button
            @click="handleEnablePush"
            :disabled="notifStore.isLoading"
            class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap transition-all cursor-pointer"
          >
            {{ notifStore.isLoading ? '...' : 'Allow' }}
          </button>
        </div>

        <!-- Notification List -->
        <div class="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-80">
          <template v-if="notifStore.notifications.length > 0">
            <div
              v-for="notif in notifStore.notifications"
              :key="notif._id"
              @click="notifStore.markAsRead(notif._id)"
              class="p-4 hover:bg-slate-50/90 transition-all flex items-start gap-3.5 cursor-pointer relative group"
              :class="{ 'bg-indigo-50/35': !notif.isRead }"
            >
              <!-- Unread dot -->
              <span
                v-if="!notif.isRead"
                class="absolute left-2 top-5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-indigo-200"
              ></span>

              <!-- Icon -->
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs"
                :class="getTypeIcon(notif.type).bg"
              >
                {{ getTypeIcon(notif.type).icon }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline justify-between gap-2">
                  <h4 class="text-sm font-semibold text-slate-800 truncate" :class="{ 'font-bold text-slate-900': !notif.isRead }">
                    {{ notif.title }}
                  </h4>
                  <span class="text-[11px] text-slate-400 shrink-0">
                    {{ formatTime(notif.createdAt) }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {{ notif.body }}
                </p>
              </div>

              <!-- Individual Mark As Read Checkmark Button on Hover -->
              <button
                v-if="!notif.isRead"
                @click.stop="notifStore.markAsRead(notif._id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all self-center shrink-0 cursor-pointer"
                title="Mark as read"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </template>

          <!-- Empty State -->
          <div v-else class="p-8 text-center flex flex-col items-center justify-center text-slate-400">
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl mb-3">
              🔕
            </div>
            <p class="text-sm font-medium text-slate-600">No notifications yet</p>
            <p class="text-xs text-slate-400 mt-1">We'll alert you when important hospital events occur.</p>
          </div>
        </div>

        <!-- Footer / Action Toolbar -->
        <div class="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
          <span v-if="testSuccessMsg" class="text-emerald-600 font-semibold flex items-center gap-1">
            ✓ {{ testSuccessMsg }}
          </span>
          <span v-else class="text-slate-400 text-[11px]">
            {{ notifStore.permissionStatus === 'granted' ? '● Push notifications active' : 'Push notifications disabled' }}
          </span>

          <button
            @click="handleTestNotification"
            :disabled="isTesting"
            class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-slate-700 font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <span>⚡</span>
            <span>{{ isTesting ? 'Sending...' : 'Test Notification' }}</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
