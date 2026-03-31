import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  profilesSampleRate: 0.1,

  // Scraping 403/503 = expected, pas une erreur critique
  // On les gère via circuit breaker + Telegram
  beforeSend(event) {
    const msg = event.exception?.values?.[0]?.value || "";
    if (msg.includes("403") || msg.includes("503") || msg.includes("Datadome")) {
      event.level = "warning";
      event.tags = { ...event.tags, source: "scraper", blocked: "true" };
    }
    return event;
  },
});
