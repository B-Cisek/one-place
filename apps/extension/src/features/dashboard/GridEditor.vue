<script setup lang="ts">
import { GRID_COLUMNS, type WidgetDto } from '@one-place/shared'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSaveLayout } from '@/queries/widgets'
import { findWidgetDefinition } from '@/widgets/registry'
import { GRID_GAP, ROW_HEIGHT } from './grid'
import { changedLayout, compactLayout } from './layout'
import WidgetFrame from './WidgetFrame.vue'

// The only file that knows grid-layout-plus (risk R4). It is loaded lazily, when edit mode
// is switched on for the first time.
const props = defineProps<{ contextId: string; widgets: WidgetDto[] }>()
const { mutate: saveLayout } = useSaveLayout()

interface EditorItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number
}

function toEditorLayout(widgets: WidgetDto[]): EditorItem[] {
  return compactLayout(widgets).map(({ id, type, x, y, w, h }) => {
    // F-GRID-03: no smaller than the minimum size of the type
    const min = findWidgetDefinition(type)?.minSize ?? { w: 1, h: 1 }
    return { i: id, x, y, w, h, minW: min.w, minH: min.h }
  })
}

// grid-layout-plus moves items in this copy while dragging. The cache changes only on save, and
// a new cache (a save, a rollback or a refetch) replaces the copy.
const layout = ref<EditorItem[]>([])
watch(
  () => props.widgets,
  (widgets) => {
    layout.value = toEditorLayout(widgets)
  },
  { immediate: true },
)

const widgetsById = computed(() => new Map(props.widgets.map((widget) => [widget.id, widget])))

const SAVE_DELAY_MS = 500
let saveTimer: ReturnType<typeof setTimeout> | undefined

// F-GRID-04. grid-layout-plus reports a new layout after a drag or resize, but also on mount and
// after every change of `layout`, so only a real difference from the cache is saved.
function save() {
  const current = layout.value.map(({ i, x, y, w, h }) => ({ id: i, x, y, w, h }))
  const items = changedLayout(props.widgets, current)
  if (items.length > 0) saveLayout({ contextId: props.contextId, items })
}

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = undefined
    save()
  }, SAVE_DELAY_MS)
}

// A save scheduled earlier (e.g. right after mount) must not run in the middle of a drag: it would
// send a half-dragged layout, and its response would replace the layout under the pointer.
// The end of the drag or resize reports the layout again, which schedules the save anew.
function holdSave() {
  clearTimeout(saveTimer)
  saveTimer = undefined
}

// "Done" right after a drag: the pending save runs now instead of after the editor is gone
onBeforeUnmount(() => {
  if (saveTimer === undefined) return
  holdSave()
  save()
})
</script>

<template>
  <GridLayout
    v-model:layout="layout"
    :col-num="GRID_COLUMNS"
    :row-height="ROW_HEIGHT"
    :margin="[GRID_GAP, GRID_GAP]"
    vertical-compact
    is-draggable
    is-resizable
    class="grid-editor"
    @layout-updated="scheduleSave"
  >
    <GridItem
      v-for="item in layout"
      :key="item.i"
      v-bind="item"
      drag-allow-from=".widget-drag-handle"
      @move="holdSave"
      @resize="holdSave"
    >
      <WidgetFrame v-if="widgetsById.get(item.i)" :widget="widgetsById.get(item.i)!" edit-mode />
    </GridItem>
  </GridLayout>
</template>

<style scoped>
/* The place where a dragged widget will land, in the accent color instead of red */
.grid-editor {
  --vgl-placeholder-bg: var(--ui-primary);
}
</style>
