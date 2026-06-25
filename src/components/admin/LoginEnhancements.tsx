'use client'

import React, { useEffect } from 'react'

/**
 * Progressive enhancement for the Payload admin login form. Wired via
 * `admin.components.afterLogin`, so it mounts right after the login form.
 *
 * Fixes two gaps in Payload's default login:
 *  1. The password input ships with `autocomplete="off"`, so browsers never
 *     offer to save the password. We set the correct autocomplete tokens.
 *  2. There is no way to reveal the password. We inject a show/hide toggle.
 *
 * Implementation is DOM-level (not a fork of Payload's LoginForm) so it keeps
 * working across Payload upgrades. We never re-parent React-managed nodes — the
 * toggle is appended as a trailing child and positioned via CSS.
 */

const EYE =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
const EYE_OFF =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.2M6.7 6.7A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'

function enhance(): boolean {
  const form = document.querySelector<HTMLFormElement>('form.login__form')
  if (!form) return false

  const email = form.querySelector<HTMLInputElement>('input[type="email"], input[name="email"], input[name="username"]')
  if (email) {
    email.setAttribute('autocomplete', 'username')
    email.setAttribute('placeholder', 'Nhập email')
  }

  const pwd = form.querySelector<HTMLInputElement>('input[type="password"], input[name="password"]')
  if (!pwd) return false

  pwd.setAttribute('autocomplete', 'current-password')
  pwd.setAttribute('placeholder', 'Nhập mật khẩu')

  const field = pwd.closest<HTMLElement>('.field-type') ?? pwd.parentElement
  if (!field || field.querySelector('[data-aivn-pw-toggle]')) return true

  field.classList.add('aivn-pw-field')
  if (pwd.offsetHeight) field.style.setProperty('--aivn-input-h', `${pwd.offsetHeight}px`)

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.tabIndex = -1
  btn.dataset.aivnPwToggle = 'true'
  btn.setAttribute('aria-label', 'Hiện mật khẩu')
  btn.innerHTML = EYE

  let desired: 'password' | 'text' = 'password'
  btn.addEventListener('click', () => {
    desired = desired === 'password' ? 'text' : 'password'
    pwd.type = desired
    const shown = desired === 'text'
    btn.innerHTML = shown ? EYE_OFF : EYE
    btn.setAttribute('aria-label', shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')
    pwd.focus()
  })

  // Safety net: if React re-renders and resets the type, re-apply user's choice.
  pwd.addEventListener('input', () => {
    if (pwd.type !== desired) pwd.type = desired
  })

  field.appendChild(btn)
  return true
}

const LoginEnhancements: React.FC = () => {
  useEffect(() => {
    if (enhance()) return
    // The form may not be mounted yet on first paint; retry briefly.
    let tries = 0
    const id = window.setInterval(() => {
      if (enhance() || ++tries > 20) window.clearInterval(id)
    }, 50)
    return () => window.clearInterval(id)
  }, [])

  return null
}

export default LoginEnhancements
