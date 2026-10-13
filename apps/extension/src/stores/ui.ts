import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from 'wxt/utils/storage'

// F-CTX-04: each device remembers its own active context, so it is not saved on the account
const activeContextItem = storage.defineItem<string | null>('local:activeContextId', {
  fallback: null,
})

export const useUiStore = defineStore('ui', () => {
  const activeContextId = ref<string | null>(null)

  async function load() {
    activeContextId.value = await activeContextItem.getValue()
  }

  async function selectContext(id: string) {
    activeContextId.value = id
    await activeContextItem.setValue(id)
  }

  async function reset() {
    activeContextId.value = null
    await activeContextItem.removeValue()
  }

  return { activeContextId, load, selectContext, reset }
})
