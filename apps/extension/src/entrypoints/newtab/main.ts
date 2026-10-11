import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { i18n } from '@/i18n'
import App from './App.vue'
import '~/assets/main.css'

createApp(App).use(ui).use(i18n).mount('#app')
