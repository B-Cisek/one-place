import { apiErrorInfo } from '@/api/api-error'

export function mutationErrorKey(error: unknown): string | null {
  const info = apiErrorInfo(error)
  if (!info) return 'errors.network'
  // F-AUTH-05: the session ends and the sign-in screen says why
  if (info.status === 401) return null
  if (info.code === 'LIMIT_EXCEEDED') return 'errors.limitExceeded'
  if (info.code === 'NOT_FOUND') return 'errors.notFound'
  return 'errors.rejected'
}
