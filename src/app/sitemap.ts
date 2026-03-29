import type { MetadataRoute } from 'next'

const BASE_URL = 'https://lcd-premium-scanner.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/annonces`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/carte`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/simulateur`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]
}
