import { logger } from './logger'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

const TELEGRAM_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

/** Send a Telegram message. Fails silently if not configured. */
async function sendMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_API || !CHAT_ID) return false

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      logger.warn({ status: res.status, body }, 'Telegram sendMessage failed')
      return false
    }
    return true
  } catch (e) {
    logger.warn({ err: e instanceof Error ? e.message : e }, 'Telegram sendMessage error')
    return false
  }
}

/** Notify that a scan failed or timed out. */
export async function notifyScanError(scanId: string, error: string, errors: string[]) {
  const sourceSummary = errors.length > 0
    ? '\n\n<b>Erreurs sources :</b>\n' + errors.slice(0, 6).map(e => `• ${escapeHtml(e)}`).join('\n')
    : ''

  const text = [
    `🚨 <b>LCD Scanner — Scan echoue</b>`,
    ``,
    `<b>Scan ID:</b> <code>${scanId}</code>`,
    `<b>Erreur:</b> ${escapeHtml(error)}`,
    sourceSummary,
    ``,
    `<i>${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</i>`,
  ].join('\n')

  await sendMessage(text)
}

/** Notify that all scrapers returned 0 results (all blocked). */
export async function notifyAllScrapersDown(scanId: string, errors: string[]) {
  const text = [
    `⚠️ <b>LCD Scanner — Toutes les sources bloquees</b>`,
    ``,
    `Aucune annonce reelle recuperee. Seed data utilise.`,
    `<b>Scan ID:</b> <code>${scanId}</code>`,
    ``,
    errors.slice(0, 6).map(e => `• ${escapeHtml(e)}`).join('\n'),
    ``,
    `<i>${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</i>`,
  ].join('\n')

  await sendMessage(text)
}

/** Notify circuit breaker opened on a source. */
export async function notifyCircuitBreakerOpen(source: string, consecutiveFailures: number) {
  const text = [
    `🔴 <b>Circuit breaker OPEN</b> — <code>${source}</code>`,
    `${consecutiveFailures} echecs consecutifs. Source desactivee 5 min.`,
    ``,
    `<i>${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</i>`,
  ].join('\n')

  await sendMessage(text)
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
