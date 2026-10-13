import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { loadSession } from '@/api/session'
import { i18n } from '@/i18n'
import App from './App.vue'
import '~/assets/main.css'
import { createQueryClient } from '@/queries/query-client.ts'
import { VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = createQueryClient()

// Read the token before the first render, so a signed-in user never sees the sign-in screen flash
loadSession().then(() => {
  createApp(App).use(ui).use(i18n).use(VueQueryPlugin, { queryClient }).mount('#app')
})
