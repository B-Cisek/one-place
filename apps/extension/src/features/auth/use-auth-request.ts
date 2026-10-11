import { ref } from 'vue'
import { startSession } from '@/api/session'
import { authErrorKey, type AuthError } from './auth-error'

interface AuthRequestOptions {
  onSuccess: (context: { response: Response }) => Promise<void>
}

type AuthRequest = (options: AuthRequestOptions) => Promise<{ error: AuthError | null }>

// Shared by sign-in and sign-up: loading state, error message and saving the token.
export function useAuthRequest() {
  const loading = ref(false)
  const errorKey = ref<string | null>(null)

  async function run(request: AuthRequest) {
    loading.value = true
    errorKey.value = null
    try {
      const { error } = await request({
        onSuccess: async ({ response }) => {
          // The bearer plugin returns the signed session token in this header
          const token = response.headers.get('set-auth-token')
          if (token) await startSession(token)
        },
      })
      if (error) errorKey.value = authErrorKey(error)
    } catch {
      errorKey.value = 'auth.errors.network'
    } finally {
      loading.value = false
    }
  }

  return { loading, errorKey, run }
}
