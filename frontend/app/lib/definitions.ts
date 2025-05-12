import { z } from 'zod'
 
export const SignupFormSchema = z.object({
  niub: z
    .string()
    .regex(/^niub\d{8}$/, { message: "Ha de començar amb 'niub' seguit de 8 dígits." })
    .trim(),
  name: z
    .string()
    .min(2, { message: 'Ha de tenir almenys 2 caràcters.' })
    .trim(),
  surnames: z
    .string()
    .min(2, { message: 'Ha de tenir almenys 2 caràcters.' })
    .trim(),
  email: z.string().email({ message: 'Introdueix un correu electrònic vàlid.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Ha de tenir almenys 8 caràcters.' })
    .regex(/[a-zA-Z]/, { message: 'Ha de contenir almenys una lletra.' })
    .regex(/[0-9]/, { message: 'Ha de contenir almenys un número.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Ha de contenir almenys un caràcter especial.',
    })
    .trim(),
})

export const LoginFormSchemaNiub = z.object({
  niub: z.string()
    .regex(/^niub\d{8}$/, { message: "Ha de començar amb 'niub' seguit de 8 dígits." })
    .trim(),
  password: z.string().trim(),
})

export const LoginFormSchemaEmail = z.object({
  email: z.string().email({ message: 'Si us plau, introdueix un correu electrònic vàlid.' }).trim(),
  password: z.string().trim(),
})
 
export type FormState =
  | {
      success?: boolean
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export type User = {
  niub?: string
  email: string
  name: string
  surnames: string
  is_student?: boolean
  is_teacher?: boolean
  is_admin?: boolean
  password?: string
}

export type Users = {
  users: User[]
  count: number
}

export type UpdatePassword = {
  current_password: string
  new_password: string
}

export type SessionPayload = {
    user: User
    token: string
    expiresAt: Date
}