<script setup lang="ts">
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { en, pl } from '@nuxt/ui/locale'
import { session } from '@/api/session'
import HomeScreen from '@/features/home/HomeScreen.vue'

// Sign-in screens (forms, Zod, auth client) are loaded only when needed,
// so a signed-in user's new tab does not download them
const AuthScreen = defineAsyncComponent(() => import('@/features/auth/AuthScreen.vue'))

const { locale, t } = useI18n()
const uiLocale = computed(() => (locale.value === 'pl' ? pl : en))

watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('app.title')
})
</script>

<template>
  <UApp :locale="uiLocale">
    <HomeScreen v-if="session.token.value" />
    <AuthScreen v-else />
  </UApp>
</template>
