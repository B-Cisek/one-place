<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveContext } from '@/features/contexts/active-context'
import { useMutationErrorToasts } from '@/features/errors/use-mutation-error-toasts'
import { useAccountLocale } from '@/features/settings/use-account-locale'
import { useContexts } from '@/queries/contexts'
import { useOnline } from '@/queries/use-online'
import AppHeader from './AppHeader.vue'

// Not needed for the first render, so its form (and Zod) stays out of the start-up bundle
const FirstContext = defineAsyncComponent(() => import('@/features/contexts/FirstContext.vue'))
const ManageContextsModal = defineAsyncComponent(
  () => import('@/features/contexts/ManageContextsModal.vue'),
)
const SettingsSlideover = defineAsyncComponent(
  () => import('@/features/settings/SettingsSlideover.vue'),
)

const { t } = useI18n()
const { data: contexts, isError, refetch } = useContexts()
const active = useActiveContext()
const online = useOnline()
const manageOpen = ref(false)
// Mounted on the first open and kept, so the modal can animate when it closes
const manageUsed = ref(false)
const settingsOpen = ref(false)
const settingsUsed = ref(false)
useMutationErrorToasts()
useAccountLocale()

function openManage() {
  manageUsed.value = true
  manageOpen.value = true
}

function openSettings() {
  settingsUsed.value = true
  settingsOpen.value = true
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-default text-default">
    <AppHeader
      :contexts="contexts"
      :active="active"
      @manage-contexts="openManage"
      @open-settings="openSettings"
    />
    <main class="flex-1 space-y-4 p-4">
      <!-- F-SYNC-05 -->
      <UAlert
        v-if="!online"
        color="warning"
        variant="subtle"
        icon="i-lucide-wifi-off"
        :title="t('dashboard.offline')"
      />
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
    <ManageContextsModal v-if="manageUsed" v-model:open="manageOpen" />
    <SettingsSlideover v-if="settingsUsed" v-model:open="settingsOpen" />
  </div>
</template>
