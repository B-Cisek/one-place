import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'
import { nuxtUiOptions } from './nuxt-ui.config.ts'

export default defineConfig({
  // WxtVitest() adds the fake browser and aliases, but not the plugins from wxt.config.ts.
  // Component tests need Vue and Nuxt UI (with the same icons as the build).
  plugins: [WxtVitest(), vue(), ui(nuxtUiOptions())],
})
