import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: the built site works at the root as well as under
// https://<user>.github.io/lia-screen-assistant/
export default defineConfig({
  base: './',
  plugins: [react()],
})
