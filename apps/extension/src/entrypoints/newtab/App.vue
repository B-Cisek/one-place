<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { en, pl } from '@nuxt/ui/locale'
import { session } from '@/api/session'
import AuthScreen from '@/features/auth/AuthScreen.vue'
import HomeScreen from '@/features/home/HomeScreen.vue'

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
