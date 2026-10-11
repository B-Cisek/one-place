import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Every test starts PGlite and runs the migrations, which takes a few seconds on slower machines
    testTimeout: 20_000,
  },
})
