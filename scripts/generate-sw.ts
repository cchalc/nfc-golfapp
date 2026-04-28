import { generateSW } from 'workbox-build'

async function build() {
  const { count, size, warnings } = await generateSW({
    globDirectory: '.output/public',
    globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff,woff2}'],
    swDest: '.output/public/sw.js',
    clientsClaim: true,
    skipWaiting: false, // Let user control when to update
    runtimeCaching: [
      {
        // Cache Electric API responses with network-first strategy
        urlPattern: /\/api\/electric\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'electric-api',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
      {
        // Cache fonts
        urlPattern: /\.(?:woff|woff2)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        // Cache images
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
    ],
  })

  if (warnings.length > 0) {
    console.warn('Warnings:', warnings.join('\n'))
  }

  console.log(`Generated service worker: ${count} files, ${(size / 1024).toFixed(1)} KB`)
}

build().catch((err) => {
  console.error('Failed to generate service worker:', err)
  process.exit(1)
})
