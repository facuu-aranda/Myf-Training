import type { CoachPermission, SpaceMemberStatus, SpaceRole } from '../types'

export const coachingRoles: SpaceRole[] = ['owner', 'coach', 'athlete']
export const initialCoachPermissions: CoachPermission[] = ['strategy_view', 'strategy_manage', 'progress_view', 'execution_view', 'nutrition_view', 'nutrition_manage', 'notes_manage', 'athlete_manage']

export function canOpenCoaching(coachingCreateCapability: boolean) {
  return coachingCreateCapability
}

export function canManageCoachingSpace(role: SpaceRole, status: SpaceMemberStatus) {
  return status === 'active' && (role === 'owner' || role === 'coach')
}

export function canViewAthleteData(role: SpaceRole, status: SpaceMemberStatus) {
  return canManageCoachingSpace(role, status)
}

export function canManageAthleteData(role: SpaceRole, status: SpaceMemberStatus) {
  return status === 'active' && role === 'owner'
}

export function canUseCoachPermission(permission: CoachPermission, enabledPermissions: CoachPermission[]) {
  return enabledPermissions.includes(permission)
}
