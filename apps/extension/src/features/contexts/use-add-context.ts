import type { ContextFormInput } from '@one-place/shared'
import { v7 as uuidv7 } from 'uuid'
import { useContexts, useCreateContext } from '@/queries/contexts'
import { useUiStore } from '@/stores/ui'
import { positionAfterLast } from '@/lib/positions'

export function useAddContext() {
  const { data: contexts } = useContexts()
  const { mutate } = useCreateContext()
  const ui = useUiStore()

  return ({ name, icon }: ContextFormInput) => {
    // The id is known before the API answers, so the optimistic context needs no temporary id
    const id = uuidv7()
    mutate({ id, name, icon, position: positionAfterLast(contexts.value ?? []) })
    // F-CTX-02: the new context goes to the end of the list and becomes active
    void ui.selectContext(id)
  }
}
