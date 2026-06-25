import React from 'react'

/**
 * Replaces the small Payload icon in the admin nav with the AI VIETNAM mark.
 * Wired via `admin.components.graphics.Icon`.
 */
export const Icon: React.FC = () => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="AI VIETNAM"
      className="aivn-admin-icon"
      decoding="async"
      height={20}
      src="/aivietnam-logo.webp"
      width={46}
    />
  )
}

export default Icon
