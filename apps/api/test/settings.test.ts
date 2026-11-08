import { DEFAULT_THEME } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'

async function setup() {
  const { app } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  return { app, alice }
}

describe('GET /api/settings', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request('/api/settings')
    expect(res.status).toBe(401)
  })

  it('returns defaults before the first save', async () => {
    const { alice } = await setup()
    const res = await alice.get('/api/settings')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      locale: null,
      theme: DEFAULT_THEME,
      updatedAt: null,
      version: 0,
    })
  })
})

describe('PATCH /api/settings', () => {
  it('creates the row on the first save and returns it', async () => {
    const { alice } = await setup()
    const res = await alice.patch('/api/settings', { locale: 'en' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      locale: 'en',
      theme: DEFAULT_THEME,
      updatedAt: expect.any(String),
      version: 1,
    })
    expect(await (await alice.get('/api/settings')).json()).toMatchObject({ locale: 'en' })
  })

  it('updates the row and increments the version', async () => {
    const { alice } = await setup()
    await alice.patch('/api/settings', { locale: 'en' })
    const res = await alice.patch('/api/settings', { locale: null })
    expect(await res.json()).toMatchObject({ locale: null, version: 2 })
  })

  it('rejects an unsupported locale', async () => {
    const { alice } = await setup()
    const res = await alice.patch('/api/settings', { locale: 'de' })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('saves the theme and keeps it when the language changes', async () => {
    const { alice } = await setup()
    const theme = { ...DEFAULT_THEME, mode: 'dark', accent: 'green' }
    const res = await alice.patch('/api/settings', { theme })
    expect(await res.json()).toMatchObject({ theme, locale: null })
    await alice.patch('/api/settings', { locale: 'en' })
    expect(await (await alice.get('/api/settings')).json()).toMatchObject({ theme, locale: 'en' })
  })

  it('keeps the language when the theme changes', async () => {
    const { alice } = await setup()
    await alice.patch('/api/settings', { locale: 'en' })
    await alice.patch('/api/settings', { theme: { ...DEFAULT_THEME, accent: 'rose' } })
    expect(await (await alice.get('/api/settings')).json()).toMatchObject({
      locale: 'en',
      theme: { accent: 'rose' },
    })
  })

  it('rejects an unknown accent and a part of a theme', async () => {
    const { alice } = await setup()
    for (const theme of [{ ...DEFAULT_THEME, accent: 'red' }, { accent: 'green' }]) {
      const res = await alice.patch('/api/settings', { theme })
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('keeps settings of each user separate', async () => {
    const { app, alice } = await setup()
    const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
    await alice.patch('/api/settings', { locale: 'en' })
    expect(await (await bob.get('/api/settings')).json()).toMatchObject({ locale: null })
  })
})
