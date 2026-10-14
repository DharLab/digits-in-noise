import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const embed = env.VITE_EMBED === '1'

  return {
    // Embed build is vendored into the host site (served under /evanston/din/ and /denver/din/),
    // so its asset paths must be relative. Standalone stays at root.
    base: embed ? './' : '/',
    plugins: [
      vue(),
      vuetify(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    // "Last updated" on the preloader reads this instead of a hand-edited date.
    define: {
      __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  }
})
