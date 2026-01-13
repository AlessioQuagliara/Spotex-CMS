/**
 * Unauthorized Page
 * Pagina mostrata quando l'utente non ha i permessi necessari
 */
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Accesso Negato</CardTitle>
          <CardDescription className="text-center">
            Non hai i permessi necessari per accedere a questa risorsa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Se ritieni di aver bisogno dell&apos;accesso a questa pagina, contatta l&apos;amministratore del sistema.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
