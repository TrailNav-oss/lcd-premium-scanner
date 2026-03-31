import * as Sentry from "@sentry/nextjs";

// Navigation instrumentation for Sentry tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 100% traces en dev, 20% en prod
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Replay des sessions avec erreur (utile pour debug UI)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // Ne pas remonter les erreurs réseau classiques du scraper
  beforeSend(event) {
    const msg = event.exception?.values?.[0]?.value || "";
    // Fetch failed côté client = réseau flaky, pas une vraie erreur
    if (msg.includes("Failed to fetch") || msg.includes("Load failed")) {
      return null;
    }
    return event;
  },
});
