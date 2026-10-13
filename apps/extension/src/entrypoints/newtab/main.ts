import { createApp, watch } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { onlineManager, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { loadSession, session } from '@/api/session'
import { i18n } from '@/i18n'
import { clearCache, persistCache, restoreCache } from '@/queries/cache'
import { createQueryClient } from '@/queries/query-client'
import { useUiStore } from '@/stores/ui'
import App from './App.vue'
import '~/assets/main.css'

// TanStack Query assumes it is online until an 'offline' event comes. A tab opened without
// network would wait for answers instead of showing the cache with the offline banner.
onlineManager.setOnline(navigator.onLine)

const queryClient = createQueryClient()
const pinia = createPinia()
const uiStore = useUiStore(pinia)

async function start() {
  // Before the first render: the token decides between the dashboard and the sign-in screen,
  // and the restored cache and active context let the dashboard appear at once (F-SYNC-01)
  await Promise.all([loadSession(), restoreCache(queryClient), uiStore.load()])
  persistCache(queryClient)
  // F-AUTH-04: sign-out in this tab, in another tab or after a 401 removes all local data
  watch(session.token, (token) => {
    if (token) return
    void clearCache(queryClient)
    void uiStore.reset()
  })
  createApp(App).use(ui).use(i18n).use(pinia).use(VueQueryPlugin, { queryClient }).mount('#app')
}

void start()
