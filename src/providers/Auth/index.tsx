'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { AuthModal } from '@/components/Auth/AuthModal'

export type AuthUser = {
  id: number
  email: string
  name?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  openAuthModal: () => void
  closeAuthModal: () => void
  authModalOpen: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = (await res.json()) as { user?: AuthUser }
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
      authModalOpen,
      logout,
    }),
    [user, loading, refresh, authModalOpen, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal onLoginSuccess={() => void refresh()} open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </AuthContext.Provider>
  )
}
