import { z } from 'zod'
 
export const SignupFormSchema = z.object({
  niub: z
    .string()
    .regex(/^niub\d{8}$/, { message: 'NIUB must start with "niub" followed by 8 digits.' })
    .trim(),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  surnames: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
})

export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
})
 
export type FormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined

export type User = {
    niub: string
    email: string
    name: string
    surnames: string
    is_student: boolean
    is_teacher: boolean
    is_admin: boolean
}

export type SessionPayload = {
    user: User
    token: string
    expiresAt: Date
}