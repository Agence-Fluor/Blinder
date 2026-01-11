<!-- Appels Page -->
<script lang="ts">
  import { navigate } from 'sv-router/generated';
  import { onMount, onDestroy } from 'svelte';
  import { startCall, answerCall, endCall, getLocalStream } from '../services/webrtcService';
  import { initiateCall as apiInitiateCall, endCall as apiEndCall } from '../services/callApiService';
  import { getCurrentPhone } from '../services/authService';
  import { getDisplayName } from '../services/contactsService';
  import { loadProfile } from '../services/indexedDbService';
  import { addInAppNotification } from '../services/inAppNotificationService';
  import { onWebSocketMessage } from '../services/websocketService';

  let phone = $state('');
  let localAudio: HTMLAudioElement | null = null;
  let remoteAudio: HTMLAudioElement | null = null;
  let callState = $state<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  let currentCallId = $state<string | null>(null);
  let currentContact = $state<string | null>(null);
  let contactName = $state('');
  let callDirection: 'outgoing' | 'incoming' | null = null;

  // Check URL params for contact
  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const contactPhone = urlParams.get('contact');
    
    if (contactPhone) {
      currentContact = contactPhone;
      contactName = await getDisplayName(contactPhone, contactPhone);
    }

    // Get current phone
    const profile = await loadProfile();
    phone = (profile as any)?.phone || getCurrentPhone() || '';

    // Listen for incoming calls via WebSocket
    onWebSocketMessage((message) => {
      if (message.type === 'incoming_call') {
        handleIncomingCall(message.payload);
      } else if (message.type === 'call_ended') {
        handleCallEnded(message.payload);
      }
    });

    // Listen for remote stream
    window.addEventListener('remote-stream', (event: any) => {
      const stream = event.detail as MediaStream;
      if (remoteAudio) {
        remoteAudio.srcObject = stream;
        remoteAudio.play();
      }
    });
  });

  onDestroy(() => {
    if (callState !== 'idle') {
      endCurrentCall();
    }
  });

  async function handleIncomingCall(payload: any) {
    const { callId, from } = payload;
    
    // Get contact name
    const name = await getDisplayName(from, from);
    
    // Show notification
    addInAppNotification({
      type: 'call',
      title: `${name} vous appelle`,
      message: 'Appel entrant...',
      data: { callId, from },
      action: {
        label: 'Répondre',
        onClick: () => {
          answerIncomingCall(callId, from);
        },
      },
    });

    // Also show native notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${name} vous appelle`, {
        body: 'Appuyez pour répondre',
        icon: '/icon-192.png',
        tag: `call_${callId}`,
      });
    }
  }

  async function answerIncomingCall(callId: string, from: string) {
    if (!phone) return;

    callState = 'connected';
    currentCallId = callId;
    currentContact = from;
    callDirection = 'incoming';
    contactName = await getDisplayName(from, from);

    // Setup audio elements
    setupAudioElements();

    // Answer call
    await answerCall(phone, from, callId);
  }

  async function handleCallEnded(payload: any) {
    const { callId, from } = payload;
    
    if (callId === currentCallId) {
      endCurrentCall();
    } else {
      // Missed call notification
      const name = await getDisplayName(from, from);
      addInAppNotification({
        type: 'missed_call',
        title: 'Appel manqué',
        message: `Appel manqué de ${name}`,
        data: { callId, from },
        action: {
          label: 'Rappeler',
          onClick: () => {
            startNewCall(from);
          },
        },
      });

      // Native notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Appel manqué', {
          body: `Appel manqué de ${name}`,
          icon: '/icon-192.png',
          tag: `missed_${callId}`,
        });
      }
    }
  }

  function setupAudioElements() {
    // Local audio (microphone)
    const localStream = getLocalStream();
    if (localStream && !localAudio) {
      localAudio = new Audio();
      localAudio.srcObject = localStream;
      localAudio.volume = 0; // Mute local audio to avoid feedback
    }

    // Remote audio (speaker)
    if (!remoteAudio) {
      remoteAudio = new Audio();
      remoteAudio.autoplay = true;
    }
  }

  async function startNewCall(contactPhone: string) {
    if (!phone || callState !== 'idle') return;

    currentContact = contactPhone;
    contactName = await getDisplayName(contactPhone, contactPhone);
    callState = 'calling';
    callDirection = 'outgoing';

    try {
      // Initiate call via API
      const result = await apiInitiateCall(phone, contactPhone);
      currentCallId = result.callId;

      // Start WebRTC
      await startCall(phone, contactPhone);
      
      setupAudioElements();

      // Wait for connection (simplified - in production, wait for actual connection)
      setTimeout(() => {
        if (callState === 'calling') {
          callState = 'connected';
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting call:', error);
      callState = 'idle';
      alert('Erreur lors de l\'appel');
    }
  }

  async function endCurrentCall() {
    if (currentCallId && phone && currentContact) {
      try {
        await apiEndCall(currentCallId, phone, currentContact);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }

    endCall();
    
    if (localAudio) {
      localAudio.pause();
      localAudio = null;
    }
    
    if (remoteAudio) {
      remoteAudio.pause();
      remoteAudio = null;
    }

    callState = 'idle';
    currentCallId = null;
    currentContact = null;
    callDirection = null;
  }

  async function handleCallButton(contactPhone: string) {
    if (callState === 'idle') {
      await startNewCall(contactPhone);
    } else {
      await endCurrentCall();
    }
  }
</script>

<div class="pt-10 pb-24 px-4 min-h-screen">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <h1 class="text-2xl font-bold text-white">Appels</h1>
    </div>

    <!-- Active Call View -->
    {#if callState !== 'idle'}
      <div class="bg-surface rounded-2xl p-8 text-center">
        <div class="mb-8">
          <div class="w-24 h-24 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">{contactName}</h2>
          <p class="text-gray-400">
            {#if callState === 'calling'}
              Appel en cours...
            {:else if callState === 'ringing'}
              Sonnerie...
            {:else if callState === 'connected'}
              En communication
            {:else}
              Appel terminé
            {/if}
          </p>
        </div>

        <div class="flex justify-center gap-6">
          <button
            onclick={endCurrentCall}
            class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    {:else}
      <!-- Call List / Placeholder -->
      <div class="bg-surface rounded-2xl p-6">
        <div class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <p class="text-gray-400 text-lg mb-2">Appels vocaux</p>
          <p class="text-gray-500 text-sm mb-6">Sélectionnez un contact pour démarrer un appel</p>
          <button
            onclick={() => navigate('/contacts')}
            class="bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-primary/90 transition"
          >
            Voir les contacts
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
