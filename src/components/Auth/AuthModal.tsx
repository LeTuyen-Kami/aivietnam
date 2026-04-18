'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/ui'

type Tab = 'login' | 'register'

export type AuthModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange, onLoginSuccess }) => {
  const pathname = usePathname()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const resetForm = () => {
    setError(null)
    setEmail('')
    setPassword('')
    setName('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetForm()
      setTab('login')
    }
    onOpenChange(next)
  }

  const googleHref = `/api/auth/google?returnTo=${encodeURIComponent(pathname || '/')}`

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        errors?: { message: string }[]
      }
      if (!res.ok) {
        setError(data.message ?? data.errors?.[0]?.message ?? 'Đăng nhập thất bại')
        return
      }
      onLoginSuccess()
      handleOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        errors?: { message: string }[]
      }
      if (!res.ok) {
        setError(data.message ?? data.errors?.[0]?.message ?? 'Đăng ký thất bại')
        return
      }
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!loginRes.ok) {
        setError('Đã tạo tài khoản nhưng đăng nhập tự động thất bại. Hãy đăng nhập thủ công.')
        setTab('login')
        return
      }
      onLoginSuccess()
      handleOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[min(100vw-2rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg outline-none',
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <Dialog.Title className="text-lg font-semibold">Tài khoản</Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Đăng nhập hoặc đăng ký để bình luận bài viết
          </Dialog.Description>

          <div className="mb-4 flex gap-2 border-b border-border pb-1">
            <button
              type="button"
              className={cn(
                'flex-1 border-b-2 pb-2 text-sm font-medium transition-colors',
                tab === 'login'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                setTab('login')
                setError(null)
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 border-b-2 pb-2 text-sm font-medium transition-colors',
                tab === 'register'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                setTab('register')
                setError(null)
              }}
            >
              Đăng ký
            </button>
          </div>

          <a
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium shadow-xs hover:bg-accent"
            href={googleHref}
          >
            <svg aria-hidden className="size-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Tiếp tục với Google
          </a>

          <p className="mb-4 text-center text-xs text-muted-foreground">hoặc dùng email</p>

          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

          {tab === 'login' ? (
            <form className="space-y-3" onSubmit={submitLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-password">Mật khẩu</Label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={pending} type="submit">
                {pending ? 'Đang xử lý…' : 'Đăng nhập'}
              </Button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={submitRegister}>
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Tên hiển thị (tuỳ chọn)</Label>
                <Input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mật khẩu</Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={pending} type="submit">
                {pending ? 'Đang xử lý…' : 'Đăng ký'}
              </Button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
