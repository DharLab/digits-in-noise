import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const embed = env.VITE_EMBED === '1'

  return {
    // Embed build is vendored into the host site under /din/; standalone stays at root.
    base: embed ? '/din/' : '/',
    plugins: [
      vue(),
      vuetify(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
