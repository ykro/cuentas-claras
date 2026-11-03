import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Firebase only allows Google sign-in from "localhost", not 127.0.0.1.
    host: 'localhost',
    port: 5173,
  },
});
