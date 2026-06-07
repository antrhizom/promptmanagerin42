import type { MetadataRoute } from 'next'

const SITE_URL = 'https://promptmanagerin42.vercel.app'

// Alle Crawler erlaubt — inkl. der KI-Suchmaschinen-Bots (explizit aufgeführt),
// damit die Plattform als Ort „kollaborativ mit KI Unterricht entwickeln" gefunden wird.
// Der Admin-Bereich wird ausgenommen.
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-Web', 'anthropic-ai',
    'PerplexityBot', 'Perplexity-User',
    'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot',
  ]
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/admin-login'] },
      ...aiBots.map((bot) => ({ userAgent: bot, allow: '/', disallow: ['/admin', '/admin-login'] })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
