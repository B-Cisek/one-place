<script setup lang="ts">
import { DEFAULT_THEME } from '@one-place/shared'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { session } from '@/api/session'
import { useAppliedTheme } from '@/theme/use-applied-theme'
import SignInForm from './SignInForm.vue'
import SignUpForm from './SignUpForm.vue'

const { t } = useI18n()
const mode = ref<'sign-in' | 'sign-up'>('sign-in')
// Signed out there is no account theme. Signing out also removes the saved one (F-AUTH-04).
useAppliedTheme(() => DEFAULT_THEME)
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-default p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-center text-xl font-semibold text-highlighted">
          {{ t(mode === 'sign-in' ? 'auth.signIn.title' : 'auth.signUp.title') }}
        </h1>
      </template>
      <UAlert
        v-if="session.notice.value === 'session-expired'"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-clock-alert"
        :title="t('auth.sessionExpired')"
      />
      <SignInForm v-if="mode === 'sign-in'" @switch="mode = 'sign-up'" />
      <SignUpForm v-else @switch="mode = 'sign-in'" />
    </UCard>
  </main>
</template>
