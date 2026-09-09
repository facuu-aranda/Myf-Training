import { describe, expect, it } from 'vitest'
import { COMMERCIAL_PLANS, getEntitlementValue, hasEntitlement, type Entitlements } from '../src/lib/entitlements'

describe('commercial entitlements', () => {
  it('keeps the canonical public catalog and annual two-month discount', () => {
    expect(COMMERCIAL_PLANS.map((plan) => plan.code)).toEqual(['free', 'plus', 'couple', 'household', 'coach_starter', 'coach_pro'])
    const plus = COMMERCIAL_PLANS.find((plan) => plan.code === 'plus')
    expect(plus?.prices.find((price) => price.interval === 'year')?.amountMinor).toBe(7990000)
  })

  it('does not treat a sponsored member as a household owner', () => {
    const sponsored: Entitlements = { ad_free: true, history_days: -1, custom_foods_create: true, household_create: false, progress_ranges: [7, 30, 90, 180, 'all'] }
    expect(hasEntitlement(sponsored, 'ad_free')).toBe(true)
    expect(hasEntitlement(sponsored, 'custom_foods_create')).toBe(true)
    expect(hasEntitlement(sponsored, 'household_create')).toBe(false)
    expect(getEntitlementValue(sponsored, 'history_days', 30)).toBe(-1)
  })
})
