import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useContexts } from '@/queries/contexts'
import { useUiStore } from '@/stores/ui'

// F-CTX-04: the remembered context may no longer exist (e.g. deleted on another device)
export function pickActiveContext(contexts: ContextDto[], activeId: string | null) {
  return contexts.find((context) => context.id === activeId) ?? contexts[0] ?? null
}

export function useActiveContext() {
  const ui = useUiStore()
  const { data } = useContexts()
  return computed(() => pickActiveContext(data.value ?? [], ui.activeContextId))
}
