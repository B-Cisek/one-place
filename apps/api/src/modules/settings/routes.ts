import { UpdateSettingsSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { validate } from '../../lib/validate'
import { requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { getSettings, updateSettings } from './service'

export function settingsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .get('/', async (c) => c.json(await getSettings(db, c.var.user.id)))
    .patch('/', validate('json', UpdateSettingsSchema), async (c) =>
      c.json(await updateSettings(db, c.var.user.id, c.req.valid('json'))),
    )
}
