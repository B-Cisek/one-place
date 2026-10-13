<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveContext } from '@/features/contexts/active-context'
import { useContexts } from '@/queries/contexts'
import AppHeader from './AppHeader.vue'

// Not needed for the first render, so its form (and Zod) stays out of the start-up bundle
const FirstContext = defineAsyncComponent(() => import('@/features/contexts/FirstContext.vue'))

const { t } = useI18n()
const { data: contexts, isError, refetch } = useContexts()
const active = useActiveContext()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-default text-default">
    <AppHeader :contexts="contexts" :active="active" />
    <main class="flex-1 space-y-4 p-4">
      <!-- F-SYNC-02: no cache yet, so skeletons until the first answer -->
      <template v-if="!contexts">
        <UAlert
          v-if="isError"
          color="error"
          variant="subtle"
          icon="i-lucide-cloud-off"
          :title="t('dashboard.loadError')"
          :actions="[{ label: t('dashboard.retry'), onClick: () => void refetch() }]"
        />
        <div v-else class="grid gap-4 sm:grid-cols-3">
          <USkeleton v-for="n in 3" :key="n" class="h-40" />
        </div>
      </template>
      <FirstContext v-else-if="contexts.length === 0" />
      <UEmpty
        v-else-if="active"
        :icon="active.icon"
        :title="active.name"
        :description="t('dashboard.empty')"
        class="mt-16"
      />
    </main>
  </div>
</template>
