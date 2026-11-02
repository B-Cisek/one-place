<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type {
  AccentColor,
  Locale,
  ThemeMode,
  ThemeOverride,
  ThemeSettings,
} from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { signOut } from '@/features/auth/sign-out'
import { useActiveContext } from '@/features/contexts/active-context'
import { useUpdateContext } from '@/queries/contexts'
import { useMe } from '@/queries/me'
import { useSettings, useUpdateSettings } from '@/queries/settings'
import AccentPicker from './AccentPicker.vue'
import ThemeModePicker from './ThemeModePicker.vue'
import ThemeOverrideFields from './ThemeOverrideFields.vue'

const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const { data: me } = useMe()
const { data: settings } = useSettings()
const { mutate: updateSettings } = useUpdateSettings()
const active = useActiveContext()
const { mutate: updateContext } = useUpdateContext()

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

// F-THEME-04: the theme changes at once (optimistic cache), the API saves it in the background
function updateTheme(changes: Partial<ThemeSettings>) {
  if (settings.value) updateSettings({ theme: { ...settings.value.theme, ...changes } })
}
const mode = computed({
  get: () => settings.value?.theme.mode,
  set: (value?: ThemeMode) => value && updateTheme({ mode: value }),
})
const accent = computed({
  get: () => settings.value?.theme.accent,
  set: (value?: AccentColor) => value && updateTheme({ accent: value }),
})

// The section is about the active context, so its effect is visible behind the panel
const themeOverride = computed({
  get: () => active.value?.themeOverride ?? null,
  set: (value: ThemeOverride | null) => {
    if (active.value) updateContext({ id: active.value.id, themeOverride: value })
  },
})
</script>

<template>
  <USlideover v-model:open="open" :title="t('settings.title')">
    <template #body>
      <div class="space-y-6">
        <UUser v-if="me" :name="me.name" :description="me.email" icon="i-lucide-circle-user" />
        <section v-if="settings" class="space-y-3">
          <h3 class="font-semibold text-highlighted">{{ t('settings.theme.title') }}</h3>
          <UFormField :label="t('settings.theme.mode')">
            <ThemeModePicker v-model="mode" />
          </UFormField>
          <UFormField :label="t('settings.theme.accent')">
            <AccentPicker v-model="accent" />
          </UFormField>
        </section>
        <section v-if="active" class="space-y-3">
          <h3 class="font-semibold text-highlighted">
            {{ t('settings.contextTheme.title', { name: active.name }) }}
          </h3>
          <ThemeOverrideFields v-model="themeOverride" />
        </section>
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
