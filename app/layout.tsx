import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthContext'

export const metadata: Metadata = {
  title: 'Prompt Managerin',
  description: 'Erprobte KI-Prompts fur Bildungszwecke entdecken und teilen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
