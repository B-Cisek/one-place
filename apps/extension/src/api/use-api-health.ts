import { onMounted, ref } from 'vue'
import { apiClient } from './client'

export type ApiHealth = 'checking' | 'ok' | 'db-down' | 'unreachable'

export function useApiHealth() {
  const health = ref<ApiHealth>('checking')

  onMounted(async () => {
    try {
      const res = await apiClient.api.health.$get()
      health.value = res.ok ? 'ok' : 'db-down'
    } catch {
      health.value = 'unreachable'
    }
  })

  return { health }
}
