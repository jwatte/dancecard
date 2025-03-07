/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	base: './', // Use relative paths for all assets
	server: {
		open: true
	},
	build: {
		sourcemap: true,
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: 'index.html'
			}
		},
		assetsInlineLimit: 0,
		assetsDir: 'assets'
	},
	// Make sure assets in the src/assets directory are accessible
	publicDir: 'src/assets',
	test: {
		environment: 'happy-dom',
		globals: true
	}
});