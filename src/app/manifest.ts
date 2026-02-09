import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aviation Study Guide',
    short_name: 'Aviation Study',
    description: 'Master FAA handbooks with active recall and spaced repetition.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
