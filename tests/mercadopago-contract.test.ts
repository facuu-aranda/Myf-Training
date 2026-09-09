import { describe, expect, it } from 'vitest'
import { buildSignatureManifest, isFreshSignature, mapProviderSubscriptionStatus, parseSignature } from '../supabase/functions/_shared/mercadopago'

describe('Mercado Pago webhook contract', () => {
  it('builds the documented signature manifest', () => {
    expect(buildSignatureManifest('ABC123', 'request-1', '1704908010')).toBe('id:abc123;request-id:request-1;ts:1704908010;')
  })

  it('parses and validates signature freshness', () => {
    expect(parseSignature('ts=1704908010,v1=abc')).toEqual({ ts: '1704908010', v1: 'abc' })
    expect(isFreshSignature('1704908010', 1704908010 * 1000)).toBe(true)
    expect(isFreshSignature('1704908010', 1704908010 * 1000 + 15 * 60 * 1000 + 1)).toBe(false)
  })

  it('maps provider states to canonical internal statuses', () => {
    expect(mapProviderSubscriptionStatus('authorized')).toBe('active')
    expect(mapProviderSubscriptionStatus('paused')).toBe('paused')
    expect(mapProviderSubscriptionStatus('cancelled')).toBe('canceled')
    expect(mapProviderSubscriptionStatus('unknown')).toBe('past_due')
  })
})
