import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { endSession, getToken, loadSession, session, startSession } from './session'

describe('session', () => {
  beforeEach(async () => {
    fakeBrowser.reset()
    await loadSession()
  })

  it('restores the token saved by a previous tab', async () => {
    await fakeBrowser.storage.local.set({ authToken: 'saved-token' })
    await loadSession()
    expect(getToken()).toBe('saved-token')
  })

  it('saves the token on start and clears the previous notice', async () => {
    await endSession('session-expired')
    await startSession('new-token')
    expect(session.notice.value).toBeNull()
    expect(await fakeBrowser.storage.local.get('authToken')).toEqual({ authToken: 'new-token' })
  })

  it('removes the token on end and remembers why', async () => {
    await startSession('token')
    await endSession('session-expired')
    expect(getToken()).toBeNull()
    expect(session.notice.value).toBe('session-expired')
    expect(await fakeBrowser.storage.local.get('authToken')).toEqual({})
  })

  it('follows sign-in and sign-out in other tabs', async () => {
    await fakeBrowser.storage.local.set({ authToken: 'from-other-tab' })
    expect(getToken()).toBe('from-other-tab')
    await fakeBrowser.storage.local.remove('authToken')
    expect(getToken()).toBeNull()
  })
})
