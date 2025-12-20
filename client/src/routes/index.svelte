<script lang="ts">
  import { navigate } from 'sv-router/generated';
  import { onMount } from 'svelte';

  let showOnboarding = $state(true);

  onMount(() => {
    navigate(showOnboarding ? '/onboarding' : '/chat');
  });
</script>

<div>Redirection en cours...</div>
