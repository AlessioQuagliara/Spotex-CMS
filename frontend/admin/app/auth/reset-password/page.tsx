/**
 * Reset Password Page
 * Pagina per reimpostare la password con token
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { authApi } from '@/lib/api'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[^A-Za-z0-9]/, 'Password deve contenere almeno un carattere speciale'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Token non valido o mancante')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Token non valido o mancante')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await authApi.resetPassword(token, data.password)
      
      setSuccess(true)
      
      // Redirect to login dopo 3 secondi
      setTimeout(() => {
        router.push('/auth/login?reset=true')
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Errore durante il reset della password. Il token potrebbe essere scaduto.')
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
            <CardTitle className="text-2xl text-center">Password reimpostata!</CardTitle>
            <CardDescription className="text-center">
              La tua password è stata reimpostata con successo. Verrai reindirizzato alla pagina di login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Token non valido</CardTitle>
            <CardDescription className="text-center">
              Il link per reimpostare la password non è valido o è scaduto.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/auth/forgot-password">
              <Button>Richiedi nuovo link</Button>
            </Link>
          </CardFooter>
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
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reimposta password</CardTitle>
          <CardDescription className="text-center">
            Inserisci la tua nuova password
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
              <Label htmlFor="password">Nuova Password</Label>
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Reimpostazione in corso...
                </>
              ) : (
                'Reimposta password'
              )}
            </Button>
            <Link href="/auth/login" className="text-center text-sm text-muted-foreground hover:text-primary">
              Torna al login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
