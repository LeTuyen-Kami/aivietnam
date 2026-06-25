import React from 'react'

/**
 * Replaces the Payload logo on the admin login screen with the AI VIETNAM brand mark.
 * Wired via `admin.components.graphics.Logo`. Rendered inside `.login__brand`.
 */
export const Logo: React.FC = () => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="AI VIETNAM"
      className="aivn-admin-logo"
      decoding="async"
      height={92}
      src="/aivietnam-logo.webp"
      width={212}
    />
  )
}

export default Logo
