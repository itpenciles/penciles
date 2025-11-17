import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env file
  // FIX: Replaced process.cwd() with '.' to avoid type error when Node types are not available.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests to the backend server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    // Define global constants for replacement.
    define: {
      // Some libraries expect a `global` object to be defined.
      // This prevents 'global is not defined' errors in the browser.
      'global': {},
    }
  }
})