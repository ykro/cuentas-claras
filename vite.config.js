import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Firebase only allows Google sign-in from "localhost", not 127.0.0.1.
    host: 'localhost',
    port: 5173,
  },
  test: {
    // The security rules tests need the Firestore emulator: they only run with `npm run test:rules`
    // (emulators:exec sets FIRESTORE_EMULATOR_HOST). `npm test` runs everything else.
    exclude: [
      ...configDefaults.exclude,
      ...(process.env.FIRESTORE_EMULATOR_HOST ? [] : ['tests/firestore.rules.test.js']),
    ],
  },
});
