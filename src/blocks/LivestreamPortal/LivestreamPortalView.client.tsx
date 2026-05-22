'use client'

import { useMemo } from 'react'

import { useAuth } from '@/providers/Auth'

import { LivestreamPortalAdminPanel } from './LivestreamPortalAdminPanel'

type Props = {
  description?: string | null
  heading: string
  serverIsAdmin: boolean
  viewerSlot: React.ReactNode
}

function canShowLivestreamAdminPanel(user: {
  roles?: ('admin' | 'member' | 'editor' | 'moderator')[]
} | null) {
  return Boolean(user?.roles?.includes('admin') || user?.roles?.includes('moderator'))
}

/**
 * Chooses admin panel vs public viewer UI from the live session (login/logout)
 * without waiting for a full RSC refresh.
 */
export function LivestreamPortalView({
  description,
  heading,
  serverIsAdmin,
  viewerSlot,
}: Props) {
  const { user, loading } = useAuth()

  const showAdmin = useMemo(() => {
    if (loading) return serverIsAdmin
    return canShowLivestreamAdminPanel(user)
  }, [loading, serverIsAdmin, user])

  if (showAdmin) {
    return (
      <section className="container">
        <LivestreamPortalAdminPanel description={description} heading={heading} />
      </section>
    )
  }

  return viewerSlot
}
