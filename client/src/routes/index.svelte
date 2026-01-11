<script lang="ts">

  import { navigate } from 'sv-router/generated';
  import { onMount } from 'svelte';
  import { getCurrentPhone } from '../services/authService';

  onMount(async () => {
    const phone = await getCurrentPhone();//loadProfile();
    console.log("phone...", phone)
    navigate(!phone ? '/onboarding' : '/chat');
  });
</script>

<div>Redirection en cours...</div>