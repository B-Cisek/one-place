import { z } from 'zod'
import {
  GRID_COLUMNS,
  MAX_WIDGETS_PER_CONTEXT,
  WIDGET_SIZES,
  WIDGET_TYPES,
  type WidgetType,
} from './widget-types'

export const TODO_TITLE_MAX_LENGTH = 60

export const TodoConfigSchema = z.object({
  title: z.string().trim().max(TODO_TITLE_MAX_LENGTH, 'validation.widgetTitleTooLong').default(''),
  hideCompleted: z.boolean().default(false),
  // Where the tasks come from. The MVP has only the One Place API (D11).
  source: z
    .discriminatedUnion('type', [z.object({ type: z.literal('local') })])
    .default({ type: 'local' }),
})

export type TodoConfig = z.infer<typeof TodoConfigSchema>

export const widgetConfigSchemas = {
  todo: TodoConfigSchema,
} satisfies Record<WidgetType, z.ZodType>

const GridRectSchema = z.object({
  x: z.int().min(0),
  y: z.int().min(0),
  w: z.int().min(1).max(GRID_COLUMNS),
  h: z.int().min(1),
})

function fitsGrid(rect: { x: number; w: number }) {
  return rect.x + rect.w <= GRID_COLUMNS
}

const fitsGridError = { message: `A widget must fit in ${GRID_COLUMNS} columns`, path: ['w'] }

export const CreateWidgetSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(WIDGET_TYPES),
    config: z.unknown(),
    ...GridRectSchema.shape,
  })
  .refine(fitsGrid, fitsGridError)
  .transform((input, ctx) => {
    const { min } = WIDGET_SIZES[input.type]
    if (input.w < min.w || input.h < min.h) {
      ctx.addIssue({
        code: 'custom',
        message: `A ${input.type} widget must be at least ${min.w}x${min.h}`,
        path: ['w'],
      })
    }
    // The config schema depends on the type, so it is checked here and not in z.object()
    const config = widgetConfigSchemas[input.type].safeParse(input.config)
    if (!config.success) {
      for (const issue of config.error.issues) {
        ctx.addIssue({ ...issue, path: ['config', ...issue.path] })
      }
      return z.NEVER
    }
    return { ...input, config: config.data }
  })

export const LayoutItemSchema = GridRectSchema.extend({ id: z.uuid() }).refine(
  fitsGrid,
  fitsGridError,
)

export const LayoutSchema = z
  .array(LayoutItemSchema)
  .max(MAX_WIDGETS_PER_CONTEXT)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, {
    message: 'Each widget can appear in the layout only once',
  })

// The whole config is replaced. The API validates it with the schema of the widget's type.
export const UpdateWidgetSchema = z.object({ config: z.record(z.string(), z.unknown()) })

export type CreateWidgetInput = z.input<typeof CreateWidgetSchema>
export type LayoutItem = z.infer<typeof LayoutItemSchema>
export type UpdateWidgetInput = z.infer<typeof UpdateWidgetSchema>
