<script setup lang="ts">
import { ACCENT_COLORS, type AccentColor } from '@one-place/shared'
import { useI18n } from 'vue-i18n'

// With `inherit` the first swatch means "same as the global theme", and its value is undefined
const model = defineModel<AccentColor | undefined>({ required: true })
defineProps<{ inherit?: boolean }>()
const { t } = useI18n()

const swatch =
  'size-7 cursor-pointer rounded-full aria-checked:outline-2 aria-checked:outline-offset-2 aria-checked:outline-inverted'
</script>

<template>
  <div role="radiogroup" class="flex flex-wrap gap-2">
    <button
      v-if="inherit"
      type="button"
      role="radio"
      :aria-checked="model === undefined"
      :aria-label="t('settings.theme.inherit')"
      :title="t('settings.theme.inherit')"
      :class="[swatch, 'grid place-items-center border border-default text-muted']"
      @click="model = undefined"
    >
      <UIcon name="i-lucide-globe" class="size-4" />
    </button>
    <!-- An inline style, because Tailwind does not see class names built at run time -->
    <button
      v-for="accent in ACCENT_COLORS"
      :key="accent"
      type="button"
      role="radio"
      :aria-checked="model === accent"
      :aria-label="t(`settings.theme.accents.${accent}`)"
      :title="t(`settings.theme.accents.${accent}`)"
      :class="swatch"
      :style="{ backgroundColor: `var(--color-${accent}-500)` }"
      @click="model = accent"
    />
  </div>
</template>
