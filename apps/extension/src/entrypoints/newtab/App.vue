<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { en, pl } from '@nuxt/ui/locale'
import { ACCENT_COLORS, accentCssVariables, type AccentColor } from '@one-place/shared'
import { useApiHealth } from '@/api/use-api-health'

const { locale, t } = useI18n()
const uiLocale = computed(() => (locale.value === 'pl' ? pl : en))

watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('app.title')
})

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
  <UApp :locale="uiLocale">
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
