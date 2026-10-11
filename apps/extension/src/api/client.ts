import { hc } from 'hono/client'
import type { AppType } from '@one-place/api'

export const apiClient = hc<AppType>(import.meta.env.WXT_API_URL)
