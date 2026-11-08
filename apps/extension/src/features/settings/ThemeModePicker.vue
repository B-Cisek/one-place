<script setup lang="ts">
import { THEME_MODES, type ThemeMode } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// With `inherit` the first option means "same as the global theme", and its value is undefined
const model = defineModel<ThemeMode | undefined>({ required: true })
const props = defineProps<{ inherit?: boolean }>()
const { t } = useI18n()

const icons: Record<ThemeMode, string> = {
  light: 'i-lucide-sun',
  dark: 'i-lucide-moon',
  system: 'i-lucide-monitor',
}
const options = computed(() => [
  ...(props.inherit
    ? [{ value: undefined, label: t('settings.theme.inherit'), icon: 'i-lucide-globe' }]
    : []),
  ...THEME_MODES.map((mode) => ({
    value: mode,
    label: t(`settings.theme.modes.${mode}`),
    icon: icons[mode],
  })),
])
</script>

<template>
  <div role="radiogroup" class="flex flex-wrap gap-1">
    <UButton
      v-for="option in options"
      :key="option.value ?? 'inherit'"
      role="radio"
      :aria-checked="model === option.value"
      :label="option.label"
      :icon="option.icon"
      :color="model === option.value ? 'primary' : 'neutral'"
      :variant="model === option.value ? 'solid' : 'outline'"
      @click="model = option.value"
    />
  </div>
</template>
