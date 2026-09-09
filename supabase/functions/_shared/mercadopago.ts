export function parseSignature(value: string) {
  return Object.fromEntries(value.split(',').map((part) => part.split('=', 2)).filter(([key, item]) => key && item))
}

export function buildSignatureManifest(dataId: string, requestId: string, timestamp: string) {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`
}

export function isFreshSignature(timestamp: string, now = Date.now(), toleranceMs = 15 * 60 * 1000) {
  const milliseconds = Number(timestamp) * 1000
  return Number.isFinite(milliseconds) && Math.abs(now - milliseconds) <= toleranceMs
}

export function mapProviderSubscriptionStatus(value: unknown) {
  const status = String(value ?? '').toLowerCase()
  if (status === 'authorized' || status === 'active') return 'active' as const
  if (status === 'paused') return 'paused' as const
  if (status === 'pending') return 'pending' as const
  if (status === 'cancelled' || status === 'canceled') return 'canceled' as const
  return 'past_due' as const
}
