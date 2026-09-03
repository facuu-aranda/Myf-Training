import { UserPlus, Home, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { Avatar, GlassCard, NeonButton, Toast } from '../components/ui'
import { getPublicProfileByHandle, sendFollowRequest } from '../lib/people'
import { getMyHousehold, inviteToHousehold } from '../lib/household'
import type { PublicProfile, Household, HouseholdMember } from '../types'

export function PublicProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { handle } = useParams<{ handle: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [household, setHousehold] = useState<{ household: Household; members: HouseholdMember[] } | null>(null)

  useEffect(() => {
    async function load() {
      if (!handle) return
      setLoading(true)
      try {
        const [prof, house] = await Promise.all([
          getPublicProfileByHandle(handle),
          getMyHousehold()
        ])
        setProfile(prof)
        setHousehold(house)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [handle])

  const handleFollow = async () => {
    if (!profile) return
    try {
      await sendFollowRequest(profile.id)
      setToast(t('people.followSent'))
    } catch {
      setToast(t('people.followError'))
    }
  }

  const handleInvite = async () => {
    if (!profile || !household) return
    try {
      await inviteToHousehold(household.household.id, profile.id)
      setToast(t('people.invitationSent'))
    } catch {
      setToast(t('people.invitationError'))
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <p>{t('common.loading')}</p>
        </div>
      </PageMotion>
    )
  }

  if (!profile) {
    return (
      <PageMotion>
        <div className="empty-state">
          <h2>{t('people.profileNotFound')}</h2>
          <NeonButton onClick={() => navigate('/app/people')}>{t('common.back')}</NeonButton>
        </div>
      </PageMotion>
    )
  }

  const canInvite = household && household.household.ownerUserId !== profile.id && household.members.length < household.household.maxMembers

  return (
    <PageMotion>
      <div className="page-header">
        <NeonButton variant="ghost" size="sm" onClick={() => navigate('/app/people')} style={{ marginBottom: '15px' }}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </NeonButton>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <GlassCard style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
          <h1 style={{ marginTop: '20px', fontSize: '24px', color: '#fff' }}>{profile.displayName}</h1>
          <p style={{ color: '#a998bc', fontSize: '16px', marginTop: '5px' }}>@{profile.publicHandle}</p>

          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <NeonButton onClick={handleFollow}>
              <UserPlus size={16} />
              {t('people.follow')}
            </NeonButton>
            {canInvite && (
              <NeonButton variant="secondary" onClick={handleInvite}>
                <Home size={16} />
                {t('people.inviteToHousehold')}
              </NeonButton>
            )}
          </div>
        </GlassCard>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </PageMotion>
  )
}
