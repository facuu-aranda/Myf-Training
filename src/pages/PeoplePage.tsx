import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { Avatar, GlassCard, NeonButton } from '../components/ui'
import { getIncomingFollowRequests, getPublicProfileByCode, respondToFollowRequest, searchPublicProfiles } from '../lib/people'
import type { ProfileFollow, PublicProfile } from '../types'

export function PeoplePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)
  const [followRequests, setFollowRequests] = useState<ProfileFollow[]>([])

  useEffect(() => { void getIncomingFollowRequests().then(setFollowRequests).catch(() => undefined) }, [])

  const handleFollowResponse = async (request: ProfileFollow, decision: 'accepted' | 'rejected') => {
    try { await respondToFollowRequest(request.id, decision); setFollowRequests((current) => current.filter((item) => item.id !== request.id)) } catch { setError(true) }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(false)
    setSearched(true)
    try {
      let profiles: PublicProfile[] = []
      const cleanQuery = query.trim()

      if (cleanQuery.toUpperCase().startsWith('TT-')) {
        const profile = await getPublicProfileByCode(cleanQuery.toUpperCase())
        if (profile) profiles = [profile]
      } else {
        profiles = await searchPublicProfiles(cleanQuery)
      }

      setResults(profiles)
    } catch (err) {
      setError(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageMotion>
      <div className="page-header">
        <div>
          <span className="eyebrow-label">{t('people.title')}</span>
          <h1>{t('people.title')}</h1>
          <p>{t('people.subtitle')}</p>
        </div>
      </div>

      {followRequests.length > 0 && <div className="follow-requests-card"><GlassCard><span className="eyebrow-label">{t('people.followRequests')}</span><h2>{t('people.pendingFollows')}</h2>{followRequests.map((request) => <div className="follow-request-row" key={request.id}><span>{t('people.newFollowRequest')}</span><div><NeonButton size="sm" onClick={() => { void handleFollowResponse(request, 'accepted') }}>{t('people.acceptFollow')}</NeonButton><NeonButton size="sm" variant="ghost" onClick={() => { void handleFollowResponse(request, 'rejected') }}>{t('people.rejectFollow')}</NeonButton></div></div>)}</GlassCard></div>}
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <div className="search-bar" style={{ flex: 1, margin: 0 }}>
            <Search size={18} color="#a998bc" />
            <input
              type="text"
              placeholder={t('people.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <NeonButton type="submit" disabled={loading || !query.trim()}>
            {loading ? t('common.loading') : t('people.search')}
          </NeonButton>
        </form>

        {error && (
          <div className="empty-state">
            <p>{t('people.error')}</p>
          </div>
        )}

        {!error && searched && results.length === 0 && !loading && (
          <div className="empty-state">
            <p>{t('people.noResults')}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {results.map((profile) => (
            <GlassCard
              key={profile.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px 20px',
                cursor: 'pointer',
                transition: 'transform 0.2s, background 0.2s',
              }}
              role="button" tabIndex={0} onClick={() => navigate(`/app/people/${profile.publicHandle}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/app/people/${profile.publicHandle}`) } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Avatar src={profile.avatarUrl} name={profile.displayName} size="md" />
                <div>
                  <strong style={{ display: 'block', color: '#e5dafa', fontSize: '16px' }}>
                    {profile.displayName}
                  </strong>
                  <span style={{ color: '#a998bc', fontSize: '13px' }}>
                    @{profile.publicHandle}
                  </span>
                </div>
              </div>
              <NeonButton variant="ghost" size="sm">
                {t('people.viewProfile')}
              </NeonButton>
            </GlassCard>
          ))}
        </div>
      </div>
    </PageMotion>
  )
}
