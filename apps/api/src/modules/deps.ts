import type { Auth } from '../auth'
import type { Database } from '../db/client'

export interface ModuleDeps {
  db: Database
  auth: Auth
}
