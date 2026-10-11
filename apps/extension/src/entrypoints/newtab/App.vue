<script setup lang="ts">
import { ref } from 'vue'
import { ACCENT_COLORS, accentCssVariables, type AccentColor } from '@one-place/shared'
import { useApiHealth } from '@/api/use-api-health'

const { health } = useApiHealth()
const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function setAccent(accent: AccentColor) {
  for (const [name, value] of Object.entries(accentCssVariables(accent))) {
    document.documentElement.style.setProperty(name, value)
  }
}
</script>

<template>
  <UApp>
    <main class="grid min-h-screen place-items-center bg-default text-default">
      <div class="flex flex-col items-center gap-6">
        <UButton icon="i-lucide-rocket" label="Nuxt UI działa" />
        <div class="flex flex-wrap justify-center gap-2">
          <UButton
            v-for="accent in ACCENT_COLORS"
            :key="accent"
            :label="accent"
            size="xs"
            variant="soft"
            @click="setAccent(accent)"
          />
        </div>
        <UButton
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          variant="outline"
          @click="toggleDark"
        />
        <UBadge
          :label="`API: ${health}`"
          :color="health === 'ok' ? 'success' : 'error'"
          variant="subtle"
        />
      </div>
    </main>
  </UApp>
</template>
