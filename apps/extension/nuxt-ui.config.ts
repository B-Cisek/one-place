import type ui from '@nuxt/ui/vite'

// The same Nuxt UI options in the build (wxt.config.ts) and in component tests (vitest.config.ts).
// The scanner puts in the bundle the icons it finds in src, also in .ts files (e.g. widget icons
// in registry.ts). Icons from outside src (context icons from shared) are passed in. Any other
// icon would be fetched from the Iconify API.
export function nuxtUiOptions(dataIcons: readonly string[] = []) {
  return {
    router: false,
    colorMode: false,
    ui: { colors: { primary: 'blue', neutral: 'zinc' } },
    icon: { clientBundle: { scan: { globInclude: ['src/**/*.{vue,ts}'] }, icons: [...dataIcons] } },
  } satisfies Parameters<typeof ui>[0]
}
