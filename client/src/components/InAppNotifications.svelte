<!-- In-App Notifications Component -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { subscribeToInAppNotifications, removeInAppNotification, type InAppNotification } from '../services/inAppNotificationService';

  let notifications = $state<InAppNotification[]>([]);
  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    unsubscribe = subscribeToInAppNotifications((notifs) => {
      notifications = notifs;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function getIcon(type: string) {
    switch (type) {
      case 'call':
        return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
      case 'missed_call':
        return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
      case 'message':
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  function getColor(type: string) {
    switch (type) {
      case 'call':
        return 'bg-green-500';
      case 'missed_call':
        return 'bg-red-500';
      case 'message':
        return 'bg-primary';
      default:
        return 'bg-gray-600';
    }
  }
</script>

<!-- Notifications Container -->
<div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
  {#each notifications.slice(0, 5) as notification (notification.id)}
    <div
      class="bg-surface border border-white/10 rounded-lg p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-right duration-300 flex items-start gap-3"
    >
      <div class="flex-shrink-0">
        <div class="w-10 h-10 {getColor(notification.type)} rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d={getIcon(notification.type)} />
          </svg>
        </div>
      </div>
      
      <div class="flex-1 min-w-0">
        <h4 class="font-semibold text-white text-sm mb-1">{notification.title}</h4>
        <p class="text-gray-300 text-xs">{notification.message}</p>
        
        {#if notification.action}
          <button
            onclick={() => {
              notification.action?.onClick();
              removeInAppNotification(notification.id);
            }}
            class="mt-2 text-primary text-xs font-medium hover:underline"
          >
            {notification.action.label}
          </button>
        {/if}
      </div>
      
      <button
        onclick={() => removeInAppNotification(notification.id)}
        class="flex-shrink-0 text-gray-400 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/each}
</div>

<style>
  @keyframes slide-in-from-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-in {
    animation: slide-in-from-right 0.3s ease-out;
  }
</style>

