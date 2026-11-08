import { DEFAULT_THEME, type SettingsDto, type UpdateSettingsInput } from '@one-place/shared'
import { eq, sql } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { userSettings } from '../../db/schema'

// The row is created on the first save, so sign-up does not need an extra hook
const DEFAULT_SETTINGS: SettingsDto = {
  locale: null,
  theme: DEFAULT_THEME,
  updatedAt: null,
  version: 0,
}

function toSettingsDto(row: typeof userSettings.$inferSelect): SettingsDto {
  return {
    locale: row.locale,
    // A row saved before the user chose a theme (e.g. only the language) has null
    theme: row.theme ?? DEFAULT_THEME,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

export async function getSettings(db: Database, userId: string): Promise<SettingsDto> {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  return row ? toSettingsDto(row) : DEFAULT_SETTINGS
}

export async function updateSettings(
  db: Database,
  userId: string,
  input: UpdateSettingsInput,
): Promise<SettingsDto> {
  const [row] = await db
    .insert(userSettings)
    .values({ userId, ...input })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...input, updatedAt: sql`now()`, version: sql`${userSettings.version} + 1` },
    })
    .returning()
  // An upsert always returns exactly one row
  return toSettingsDto(row!)
}
