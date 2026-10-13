import { endSession } from '@/api/session'

export async function signOut() {
  try {
    // Loaded only now, so the new tab of a signed-in user does not download the auth client
    const { authClient } = await import('@/api/auth-client')
    await authClient.signOut()
  } catch {
    // API unreachable: the server session will expire on its own
  }
  // F-AUTH-04: the local session always ends
  await endSession()
}
