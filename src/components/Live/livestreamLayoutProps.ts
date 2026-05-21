import type { LivestreamLayoutProps } from '@stream-io/video-react-sdk'

/** Hide default Stream overlay stats; we render them in the page header. */
export const LIVESTREAM_LAYOUT_MINIMAL_OVERLAY: Pick<
  LivestreamLayoutProps,
  | 'enableFullScreen'
  | 'ParticipantViewUI'
  | 'showDuration'
  | 'showLiveBadge'
  | 'showParticipantCount'
> = {
  ParticipantViewUI: null,
  enableFullScreen: false,
  showDuration: false,
  showLiveBadge: false,
  showParticipantCount: false,
}
