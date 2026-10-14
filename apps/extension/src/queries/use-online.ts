import { onlineManager } from '@tanstack/vue-query'
import { onScopeDispose, ref } from 'vue'

export function useOnline() {
  const online = ref(onlineManager.isOnline())
  const unsubscribe = onlineManager.subscribe((value) => {
    online.value = value
  })
  onScopeDispose(unsubscribe)
  return online
}
