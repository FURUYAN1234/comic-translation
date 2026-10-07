import { webSecurity } from './scripts/web-security.mjs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [webSecurity({ connectSources: ["https://api.openai.com","https://generativelanguage.googleapis.com","https://*.blob.core.windows.net"] }), react()],
  base: '/comic-translation/',
  server: {
    port: 5177,
    strictPort: true,
  },
})
