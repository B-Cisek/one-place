<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import { signOut } from '@/features/auth/sign-out'
import ContextSwitcher from '@/features/contexts/ContextSwitcher.vue'

defineProps<{ contexts: ContextDto[] | undefined; active: ContextDto | null }>()
const emit = defineEmits<{ manageContexts: [] }>()
const { t } = useI18n()
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-default px-4">
    <USkeleton v-if="!contexts" class="h-8 w-40" />
    <ContextSwitcher
      v-else-if="active"
      :contexts="contexts"
      :active="active"
      @manage="emit('manageContexts')"
    />
    <span v-else />
    <UButton
      icon="i-lucide-log-out"
      :aria-label="t('auth.signOut')"
      color="neutral"
      variant="ghost"
      @click="signOut"
    />
  </header>
</template>
