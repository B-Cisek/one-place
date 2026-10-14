import { createApp, watch } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { loadSession, session } from '@/api/session'
import { i18n } from '@/i18n'
import { clearCache, persistCache, restoreCache } from '@/queries/cache'
import { createQueryClient } from '@/queries/query-client'
import App from './App.vue'
import '~/assets/main.css'

const queryClient = createQueryClient()

async function start() {
  // Before the first render: the token decides between the dashboard and the sign-in screen,
  // and the restored cache lets the dashboard appear at once (F-SYNC-01)
  await Promise.all([loadSession(), restoreCache(queryClient)])
  persistCache(queryClient)
  // F-AUTH-04: sign-out in this tab, in another tab or after a 401 removes all cached data
  watch(session.token, (token) => {
    if (!token) void clearCache(queryClient)
  })
  createApp(App).use(ui).use(i18n).use(VueQueryPlugin, { queryClient }).mount('#app')
}

void start()
