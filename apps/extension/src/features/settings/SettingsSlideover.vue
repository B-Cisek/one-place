<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type { Locale } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { signOut } from '@/features/auth/sign-out'
import { useMe } from '@/queries/me'
import { useSettings, useUpdateSettings } from '@/queries/settings'

const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const { data: me } = useMe()
const { data: settings } = useSettings()
const { mutate: updateSettings } = useUpdateSettings()

// A radio value cannot be null, so 'browser' stands for "no language saved on the account"
const languages = computed<RadioGroupItem[]>(() => [
  { label: t('settings.language.browser'), value: 'browser' },
  { label: 'Polski', value: 'pl' },
  { label: 'English', value: 'en' },
])
const language = computed({
  get: () => settings.value?.locale ?? 'browser',
  set: (value: string) =>
    updateSettings({ locale: value === 'browser' ? null : (value as Locale) }),
})
</script>

<template>
  <USlideover v-model:open="open" :title="t('settings.title')">
    <template #body>
      <div class="space-y-6">
        <UUser v-if="me" :name="me.name" :description="me.email" icon="i-lucide-circle-user" />
        <UFormField :label="t('settings.language.label')">
          <URadioGroup v-model="language" :items="languages" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton
        icon="i-lucide-log-out"
        :label="t('auth.signOut')"
        color="neutral"
        variant="outline"
        block
        @click="signOut"
      />
    </template>
  </USlideover>
</template>
