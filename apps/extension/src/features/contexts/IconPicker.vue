<script setup lang="ts">
import { CONTEXT_ICONS, type ContextIcon } from '@one-place/shared'
import { useI18n } from 'vue-i18n'

const model = defineModel<ContextIcon>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div role="radiogroup" class="grid grid-cols-8 gap-1">
    <UButton
      v-for="icon in CONTEXT_ICONS"
      :key="icon"
      role="radio"
      :aria-checked="model === icon"
      :aria-label="t(`contexts.icons.${icon.replace('i-lucide-', '')}`)"
      :icon="icon"
      :color="model === icon ? 'primary' : 'neutral'"
      :variant="model === icon ? 'solid' : 'ghost'"
      square
      @click="model = icon"
    />
  </div>
</template>
