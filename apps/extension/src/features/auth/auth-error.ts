export interface AuthError {
  status: number
  code?: string
}

export function authErrorKey(error: AuthError) {
  if (error.status === 401) return 'auth.errors.invalidCredentials'
  if (error.status === 422 && error.code?.startsWith('USER_ALREADY_EXISTS')) {
    return 'auth.errors.emailTaken'
  }
  if (error.status === 429) return 'auth.errors.tooManyAttempts'
  return 'auth.errors.unknown'
}
