import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { useUiStore } from './ui'

// A new Pinia instance is what a newly opened tab gets
function storeInNewTab() {
  setActivePinia(createPinia())
  return useUiStore()
}

describe('ui store', () => {
  beforeEach(() => {
    fakeBrowser.reset()
  })

  it('remembers the selected context for the next tab on this device', async () => {
    await storeInNewTab().selectContext('work')
    const nextTab = storeInNewTab()
    await nextTab.load()
    expect(nextTab.activeContextId).toBe('work')
  })

  it('forgets the selected context on reset', async () => {
    const store = storeInNewTab()
    await store.selectContext('work')
    await store.reset()
    expect(store.activeContextId).toBeNull()
    const nextTab = storeInNewTab()
    await nextTab.load()
    expect(nextTab.activeContextId).toBeNull()
  })

  // F-GRID-02: a new tab always opens in preview mode
  it('does not remember edit mode', async () => {
    storeInNewTab().editMode = true
    const nextTab = storeInNewTab()
    await nextTab.load()
    expect(nextTab.editMode).toBe(false)
  })
})
