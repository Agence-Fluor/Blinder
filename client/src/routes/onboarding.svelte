<script lang="ts">
  import Onboarding from '../components/Onboarding.svelte';
  import { navigate } from 'sv-router/generated';
  import type { UserProfile } from '../types';
  import { DEFAULT_USER_PROFILE } from '../constants';

  let userProfile: UserProfile = $state({ ...DEFAULT_USER_PROFILE });

  const handleComplete = () => {
    navigate('/chat');

    
  }
</script>

<Onboarding bind:profile={userProfile} onComplete={handleComplete} />
