import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      ui({
        router: false,
        colorMode: false,
        ui: { colors: { primary: 'blue', neutral: 'zinc' } },
        icon: { clientBundle: { scan: true } },
      }),
    ],
  }),
  manifest: {
    name: 'One Place',
    version: '0.0.1',
    permissions: ['storage'],
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuMAlGGnNzf3yujiMRnhVtPSP8xZx7PQ/42PHdGXzK7yhiQ2NuryU+aJNgQBLcTTjP0cAOhc4sS2ntY8Cb6KiTYFEXfdcY3A/ptetjHZo0ijwcL3bxpVlAQ+H1+dWez1JsR+hLJx9oDS45qT7M3sky7UPx0DiJycDdXBtwHHly5+mqhtRa8BPvc98pyIGG4crYxsULCC+8crv5lyVv76auZIAWHsn14YmE6oGfsNTn9aWy6LWVh6AO8Ggj8T5WfUfbmk1SQTYSkbCk0U0qs8LS1kBzotbKytizJb/DAGkIn4gCqtXo0flP0/fzzaGISxAsnrHQJTcTdtUq4Buvlv4CwIDAQAB',
  },
})
