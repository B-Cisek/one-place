import { z } from 'zod'

export const NAME_MAX_LENGTH = 50
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

// Messages are i18n keys. The extension translates them, the API never shows them to users.
export const NameSchema = z
  .string()
  .trim()
  .min(1, 'validation.nameRequired')
  .max(NAME_MAX_LENGTH, 'validation.nameTooLong')

const EmailSchema = z.email('validation.emailInvalid')

export const SignUpSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'validation.passwordTooShort')
    .max(PASSWORD_MAX_LENGTH, 'validation.passwordTooLong'),
})

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'validation.passwordRequired'),
})

export type SignUpInput = z.infer<typeof SignUpSchema>
export type SignInInput = z.infer<typeof SignInSchema>
