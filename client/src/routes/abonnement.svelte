<!-- Subscription Page -->
<script lang="ts">
  import { navigate } from 'sv-router/generated';

  const price = 1.10;
  const currency = '€';
  const period = 'mois';
</script>

<div class="pt-10 pb-24 px-4 min-h-screen">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <button
        onclick={() => navigate('/profil')}
        class="mr-4 text-gray-400 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-white">Abonnement</h1>
    </div>

    <!-- Content -->
    <div class="bg-surface rounded-2xl p-6 space-y-6">
      <!-- Price Display -->
      <div class="text-center py-6">
        <div class="text-5xl font-bold text-primary mb-2">
          {price}{currency}
        </div>
        <div class="text-gray-400 text-sm">
          par {period}
        </div>
        <div class="text-gray-500 text-xs mt-2">
          Le prix d'une baguette 🥖
        </div>
      </div>

      <!-- Features List -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-white mb-4">Ce qui est inclus :</h2>
        
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p class="text-white font-medium">Lorem ipsum dolor sit amet</p>
              <p class="text-gray-400 text-sm mt-1">
                Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p class="text-white font-medium">Sed ut perspiciatis unde omnis</p>
              <p class="text-gray-400 text-sm mt-1">
                Natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p class="text-white font-medium">At vero eos et accusamus et iusto</p>
              <p class="text-gray-400 text-sm mt-1">
                Odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p class="text-white font-medium">Similique sunt in culpa qui officia</p>
              <p class="text-gray-400 text-sm mt-1">
                Deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio nam libero tempore cum soluta nobis est eligendi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscribe Button -->
      <button
        onclick={() => {
          // TODO: Implement subscription payment
          alert('Fonctionnalité d\'abonnement à venir');
        }}
        class="w-full bg-primary text-white px-6 py-4 rounded-lg font-semibold hover:bg-primary/90 transition text-lg"
      >
        S'abonner pour {price}{currency}/{period}
      </button>

      <!-- Terms -->
      <div class="text-gray-400 text-xs text-center space-y-1 pt-4 border-t border-white/10">
        <p>L'abonnement se renouvelle automatiquement chaque mois</p>
        <p>Vous pouvez annuler à tout moment dans les paramètres</p>
        <p>Remboursement possible dans les 14 jours suivant l'achat</p>
      </div>
    </div>
  </div>
</div>

