<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import ContextSwitcher from '@/features/contexts/ContextSwitcher.vue'
import { useUiStore } from '@/stores/ui'
import { useNarrowScreen } from './use-narrow-screen'

defineProps<{ contexts: ContextDto[] | undefined; active: ContextDto | null }>()
const emit = defineEmits<{ manageContexts: []; openSettings: []; addWidget: [] }>()
const { t } = useI18n()
const ui = useUiStore()
const narrow = useNarrowScreen()
</script>

<template>
  <header class="flex h-14 items-center justify-between gap-2 border-b border-default px-4">
    <USkeleton v-if="!contexts" class="h-8 w-40" />
    <ContextSwitcher
      v-else-if="active"
      :contexts="contexts"
      :active="active"
      @manage="emit('manageContexts')"
    />
    <span v-else />
    <div class="flex shrink-0 items-center gap-1">
      <!-- F-GRID-02, F-GRID-05: no edit mode on a narrow screen -->
      <template v-if="active && !narrow">
        <UButton
          v-if="ui.editMode"
          icon="i-lucide-plus"
          :label="t('dashboard.addWidget')"
          color="neutral"
          variant="outline"
          @click="emit('addWidget')"
        />
        <UButton
          :icon="ui.editMode ? 'i-lucide-check' : 'i-lucide-layout-dashboard'"
          :label="ui.editMode ? t('dashboard.done') : t('dashboard.edit')"
          :color="ui.editMode ? 'primary' : 'neutral'"
          :variant="ui.editMode ? 'solid' : 'ghost'"
          :aria-pressed="ui.editMode"
          @click="ui.editMode = !ui.editMode"
        />
      </template>
      <UButton
        icon="i-lucide-settings"
        :aria-label="t('settings.title')"
        color="neutral"
        variant="ghost"
        @click="emit('openSettings')"
      />
    </div>
  </header>
</template>
