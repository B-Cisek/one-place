import { readonly, ref } from 'vue'
import { storage } from 'wxt/utils/storage'

export type SessionNotice = 'session-expired'

const tokenItem = storage.defineItem<string | null>('local:authToken', { fallback: null })

const token = ref<string | null>(null)
const notice = ref<SessionNotice | null>(null)
let stopWatching: (() => void) | undefined

export const session = { token: readonly(token), notice: readonly(notice) }

export function getToken() {
  return token.value
}

export async function loadSession() {
  token.value = await tokenItem.getValue()
  // Every open new tab has its own copy of the token. Keep them in sync.
  stopWatching?.()
  stopWatching = tokenItem.watch((value) => {
    token.value = value
  })
}

export async function startSession(newToken: string) {
  token.value = newToken
  notice.value = null
  await tokenItem.setValue(newToken)
}

export async function endSession(reason: SessionNotice | null = null) {
  token.value = null
  notice.value = reason
  await tokenItem.removeValue()
}
