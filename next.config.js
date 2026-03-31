const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.bienici.com' },
      { protocol: 'https', hostname: '**.seloger.com' },
      { protocol: 'https', hostname: '**.leboncoin.fr' },
      { protocol: 'https', hostname: '**.lbc.bzh' },
      { protocol: 'https', hostname: '**.pap.fr' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps for better stack traces in prod
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Hide source maps from users
  hideSourceMaps: true,
});
