import { mount } from 'svelte';
import App from './App.svelte';
import { clearAllData } from './services/indexedDbService';

// Check for ?reset parameter to clear IndexedDB
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('reset') === 'true') {
  clearAllData()
    .then(() => {
      console.log('IndexedDB cleared via ?reset parameter');
      // Remove ?reset from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Reload page
      window.location.reload();
    })
    .catch((error) => {
      console.error('Error clearing IndexedDB:', error);
      // Mount app even if clear fails
      mount(App, { target: document.querySelector('#app')! });
    });
} else {
  mount(App, { target: document.querySelector('#app')! });
}
