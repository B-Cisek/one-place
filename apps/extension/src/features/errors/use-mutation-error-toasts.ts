import { useToast } from '@nuxt/ui/composables'
import { useQueryClient } from '@tanstack/vue-query'
import { onScopeDispose } from 'vue'
import { useI18n } from 'vue-i18n'
import { mutationErrorKey } from './mutation-error'

// F-SYNC-04: each mutation rolls back its own change. This one listener tells the user about it.
export function useMutationErrorToasts() {
  const toast = useToast()
  const { t } = useI18n()
  const unsubscribe = useQueryClient()
    .getMutationCache()
    .subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'error') return
      const key = mutationErrorKey(event.action.error)
      if (!key) return
      toast.add({
        title: t('errors.changeReverted'),
        description: t(key),
        color: 'error',
        icon: 'i-lucide-circle-alert',
      })
    })
  onScopeDispose(unsubscribe)
}
