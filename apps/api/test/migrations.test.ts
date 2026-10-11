import { describe, expect, it } from 'vitest'
import { createTestApp } from './create-test-app'

describe('database migrations', () => {
  it('create the Better Auth tables', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    )
    expect(rows.map((row) => row.table_name)).toEqual([
      'account',
      'session',
      'user',
      'verification',
    ])
  })
})
