import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthContext'
import { VisitTracker } from '@/components/analytics/VisitTracker'

const SITE_URL = 'https://promptmanagerin42.vercel.app'
const BESCHREIBUNG =
  'Kollaborative Plattform, auf der Lehrpersonen und Lernende gemeinsam mit KI Unterricht per Prompts entwickeln: erprobte Prompts, KI-Tools und konkrete Beispiele für zugänglicheren Unterricht (weniger Hürden, mehr Lernräume, mehr formatives Feedback).'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Promptmanagerin – KI-Prompts für den Unterricht, kollaborativ entwickelt',
    template: '%s · Promptmanagerin',
  },
  description: BESCHREIBUNG,
  applicationName: 'Promptmanagerin',
  keywords: [
    'KI im Unterricht', 'Prompts für den Unterricht', 'Prompt Engineering Schule',
    'KI-Tools Bildung', 'ChatGPT Unterricht', 'Claude Unterricht', 'Gemini Unterricht',
    'kollaborativ KI Unterricht entwickeln', 'Berufsfachschule', 'Allgemeinbildung ABU',
    'formatives Feedback', 'Differenzierung', 'Digital Learning Hub',
  ],
  authors: [{ name: 'Arbeitsgruppe Team KI – Digital Learning Hub (DLH)' }],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    url: SITE_URL,
    siteName: 'Promptmanagerin',
    title: 'Promptmanagerin – KI-Prompts für den Unterricht, kollaborativ entwickelt',
    description: BESCHREIBUNG,
  },
  twitter: {
    card: 'summary',
    title: 'Promptmanagerin – KI-Prompts für den Unterricht',
    description: BESCHREIBUNG,
  },
  category: 'education',
}

// Strukturierte Daten (JSON-LD) – hilft Such- und KI-Systemen, den Zweck zu verstehen.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Promptmanagerin',
  url: SITE_URL,
  description: BESCHREIBUNG,
  inLanguage: 'de-CH',
  audience: { '@type': 'EducationalAudience', educationalRole: ['teacher', 'student'] },
  publisher: {
    '@type': 'Organization',
    name: 'Digital Learning Hub (DLH) – Arbeitsgruppe Team KI',
    url: 'https://dlh.zh.ch',
  },
  about: 'Kollaborative Entwicklung von Unterricht mit KI über erprobte Prompts und KI-Tools.',
  keywords: 'KI im Unterricht, Prompts, KI-Tools, Prompt Engineering, formatives Feedback, Differenzierung',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <VisitTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
