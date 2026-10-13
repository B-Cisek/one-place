<script setup lang="ts">
import { type ContextDto, type ContextIcon, ContextNameSchema } from '@one-place/shared'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUpdateContext } from '@/queries/contexts'
import IconPicker from './IconPicker.vue'

const props = defineProps<{ context: ContextDto }>()
const emit = defineEmits<{ delete: [] }>()

const { t } = useI18n()
const { mutate: update } = useUpdateContext()
const name = ref(props.context.name)

// The name can also change from outside: a rollback, or a refetch after a change on another device
watch(
  () => props.context.name,
  (saved) => {
    name.value = saved
  },
)

function saveName() {
  const result = ContextNameSchema.safeParse(name.value)
  // An empty name is not saved, the field goes back to the saved one
  if (!result.success) {
    name.value = props.context.name
    return
  }
  if (result.data !== props.context.name) update({ id: props.context.id, name: result.data })
}

function saveIcon(icon: ContextIcon) {
  if (icon !== props.context.icon) update({ id: props.context.id, icon })
}
</script>

<template>
  <li class="flex items-center gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="drag-handle size-5 shrink-0 cursor-grab text-muted"
      :aria-label="t('contexts.manage.drag')"
    />
    <UPopover>
      <UButton
        :icon="context.icon"
        :aria-label="t('contexts.manage.changeIcon')"
        color="neutral"
        variant="outline"
        square
      />
      <template #content>
        <div class="w-80 p-2">
          <IconPicker :model-value="context.icon" @update:model-value="saveIcon" />
        </div>
      </template>
    </UPopover>
    <UInput
      v-model="name"
      :aria-label="t('contexts.fields.name')"
      :maxlength="40"
      class="flex-1"
      @blur="saveName"
      @keydown.enter="saveName"
    />
    <UButton
      icon="i-lucide-trash-2"
      :aria-label="t('contexts.manage.delete')"
      color="error"
      variant="ghost"
      @click="emit('delete')"
    />
  </li>
</template>
