import { svelte } from '@sveltejs/vite-plugin-svelte';
import { router } from 'sv-router/vite-plugin';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [svelte(), router(), tailwindcss()],
});
