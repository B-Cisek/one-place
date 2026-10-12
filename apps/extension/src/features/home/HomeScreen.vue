<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiClient } from '@/api/client'
import { endSession } from '@/api/session'
import { useApiHealth } from '@/api/use-api-health'

const { t } = useI18n()
const { health } = useApiHealth()
const name = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await apiClient.api.me.$get()
    if (res.ok) name.value = (await res.json()).name
  } catch {
    // Offline: keep the session, the greeting simply stays hidden
  }
})

async function signOut() {
  try {
    const { authClient } = await import('@/api/auth-client')
    await authClient.signOut()
  } catch {
    // API unreachable: the server session will expire on its own
  }
  // F-AUTH-04: the local session always ends
  await endSession()
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-default text-default">
    <div class="flex flex-col items-center gap-6">
      <h1 v-if="name" class="text-2xl font-semibold text-highlighted">
        {{ t('home.greeting', { name }) }}
      </h1>
      <UBadge
        :label="`API: ${health}`"
        :color="health === 'ok' ? 'success' : 'error'"
        variant="subtle"
      />
      <UButton
        icon="i-lucide-log-out"
        :label="t('auth.signOut')"
        variant="outline"
        @click="signOut"
      />
    </div>
  </main>
</template>
