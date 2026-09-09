import { describe, expect, it } from 'vitest'
import { canManageAthleteData, canManageCoachingSpace, canOpenCoaching, canUseCoachPermission, canViewAthleteData, coachingRoles, initialCoachPermissions } from '../src/lib/coaching'
import { canEditCustomExercise, customExerciseVisibilities } from '../src/lib/exercise'

describe('coaching foundation permissions', () => {
  it('keeps coaching roles explicit and scoped to active memberships', () => {
    expect(coachingRoles).toEqual(['owner', 'coach', 'athlete'])
    expect(canOpenCoaching(true)).toBe(true)
    expect(canOpenCoaching(false)).toBe(false)
    expect(canManageCoachingSpace('coach', 'active')).toBe(true)
    expect(canManageCoachingSpace('coach', 'inactive')).toBe(false)
    expect(canViewAthleteData('athlete', 'active')).toBe(false)
  })

  it('only owners can manage athlete data in the foundation policy', () => {
    expect(initialCoachPermissions).toContain('strategy_manage')
    expect(canUseCoachPermission('strategy_manage', initialCoachPermissions)).toBe(true)
    expect(canUseCoachPermission('nutrition_manage', ['strategy_view'])).toBe(false)
    expect(customExerciseVisibilities).toEqual(['private', 'space'])
    expect(canEditCustomExercise('user-1', 'user-1')).toBe(true)
    expect(canEditCustomExercise('user-1', 'user-2')).toBe(false)
    expect(canManageAthleteData('owner', 'active')).toBe(true)
    expect(canManageAthleteData('coach', 'active')).toBe(false)
    expect(canManageAthleteData('owner', 'pending')).toBe(false)
  })
})
