import type { MetadataRoute } from 'next'

const SITE_URL = 'https://promptmanagerin42.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/ki-tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/p-flow`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
