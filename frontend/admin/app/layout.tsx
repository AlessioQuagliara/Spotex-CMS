import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { I18nProvider } from '@/providers/i18n-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CMS Admin',
  description: 'Pannello di amministrazione CMS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <I18nProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  )
}