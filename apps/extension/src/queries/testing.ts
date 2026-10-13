import { type QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp, effectScope } from 'vue'

// Runs a composable that uses useQueryClient() outside a component, as if inside setup()
export function withQueryClient<T>(queryClient: QueryClient, composable: () => T): T {
  const app = createApp({}).use(VueQueryPlugin, { queryClient })
  return effectScope().run(() => app.runWithContext(composable))!
}

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// A promise that the test resolves when it wants, e.g. to look at the state in between
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
