import * as z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Username deve avere almeno 3 caratteri'),
  password: z.string().min(6, 'Password deve avere almeno 6 caratteri'),
})

export const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  username: z.string()
    .min(3, 'Username deve avere almeno 3 caratteri')
    .max(20, 'Username non può superare 20 caratteri')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username può contenere solo lettere, numeri, underscore e trattini'),
  password: z.string()
    .min(8, 'Password deve avere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[^A-Za-z0-9]/, 'Password deve contenere almeno un carattere speciale'),
  confirmPassword: z.string(),
  full_name: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'Devi accettare i termini e condizioni',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>