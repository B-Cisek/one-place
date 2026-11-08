<script setup lang="ts">
import type { AccentColor, ThemeMode, ThemeOverride } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AccentPicker from './AccentPicker.vue'
import ThemeModePicker from './ThemeModePicker.vue'

// null: the context uses the global theme. Otherwise each field it has replaces the global one
// (F-THEME-03), and undefined in a field means "same as the global theme".
const override = defineModel<ThemeOverride | null>({ required: true })
const { t } = useI18n()

const useGlobal = computed({
  get: () => override.value === null,
  set: (value: boolean) => (override.value = value ? null : {}),
})
const mode = computed({
  get: () => override.value?.mode,
  set: (value?: ThemeMode) => (override.value = { ...override.value, mode: value }),
})
const accent = computed({
  get: () => override.value?.accent,
  set: (value?: AccentColor) => (override.value = { ...override.value, accent: value }),
})
</script>

<template>
  <div class="space-y-3">
    <USwitch v-model="useGlobal" :label="t('settings.contextTheme.useGlobal')" />
    <template v-if="!useGlobal">
      <UFormField :label="t('settings.theme.mode')">
        <ThemeModePicker v-model="mode" inherit />
      </UFormField>
      <UFormField :label="t('settings.theme.accent')">
        <AccentPicker v-model="accent" inherit />
      </UFormField>
    </template>
  </div>
</template>
