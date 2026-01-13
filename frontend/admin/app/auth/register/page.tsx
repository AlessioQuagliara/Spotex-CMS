/**
 * Register Page
 * Pagina di registrazione con validazione completa
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { authApi } from '@/lib/api'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve essere almeno 3 caratteri')
    .regex(/^[a-z0-9_-]+$/i, 'Usa solo lettere, numeri, _ o -'),
  fullName: z.string().min(2, 'Nome completo deve essere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  password: z
    .string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[^A-Za-z0-9]/, 'Password deve contenere almeno un carattere speciale'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Devi accettare i termini e condizioni',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  })

  const password = watch('password')
  const acceptTerms = watch('acceptTerms')

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Debug: log dell'URL API
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
      console.log('Full register URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/register`)

      // Rimuovi confirmPassword prima di inviare
      const { confirmPassword, ...registerData } = data
      
      await authApi.register({
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
        full_name: registerData.fullName,
      })
      
      setSuccess(true)
      
      // Redirect to login dopo 2 secondi
      setTimeout(() => {
        router.push('/auth/login?registered=true')
      }, 2000)
    } catch (err: any) {
      console.error('Registration error:', err)
      console.error('Error response:', err.response)
      setError(err.response?.data?.detail || 'Errore durante la registrazione. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Registrazione completata!</CardTitle>
            <CardDescription className="text-center">
              Il tuo account è stato creato con successo. Verrai reindirizzato alla pagina di login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Crea un account</CardTitle>
          <CardDescription className="text-center">
            Inserisci i tuoi dati per registrarti
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="mario-rossi"
                  className="pl-10"
                  {...register('username')}
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Mario Rossi"
                  className="pl-10"
                  {...register('fullName')}
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  className="pl-10"
                  {...register('email')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              {password && (
                <div className="space-y-1 text-xs">
                  <p className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                    ✓ Almeno 8 caratteri
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                    ✓ Una lettera maiuscola
                  </p>
                  <p className={/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                    ✓ Una lettera minuscola
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                    ✓ Un numero
                  </p>
                  <p className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                    ✓ Un carattere speciale
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setValue('acceptTerms', !!checked)}
                disabled={isLoading}
              />
              <label
                htmlFor="acceptTerms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accetto i{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  termini e condizioni
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Registrazione in corso...
                </>
              ) : (
                'Registrati'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Hai già un account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Accedi
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
