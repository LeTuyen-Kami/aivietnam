export const BLOCK_VISIBILITY_OPTIONS = ['all', 'mobile', 'tablet', 'desktop'] as const

export type BlockVisibilityOption = (typeof BLOCK_VISIBILITY_OPTIONS)[number]

const isBlockVisibilityOption = (value: string): value is BlockVisibilityOption =>
  (BLOCK_VISIBILITY_OPTIONS as readonly string[]).includes(value)

/** Normalize CMS value; empty / legacy rows behave as visible on all devices. */
export const normalizeBlockVisibility = (
  visible?: (BlockVisibilityOption | string)[] | null,
): BlockVisibilityOption[] => {
  if (!visible?.length) return ['all']

  const values = visible.filter(isBlockVisibilityOption)
  if (!values.length || values.includes('all')) return ['all']

  return values
}

/**
 * Tailwind classes for block visibility (md = 768px, lg = 1024px).
 * Prefer CSS over JS so SSR and first paint match the chosen breakpoints.
 */
export const blockVisibilityClassName = (
  visible?: (BlockVisibilityOption | string)[] | null,
): string => {
  const v = normalizeBlockVisibility(visible)

  if (v.includes('all') || (v.includes('mobile') && v.includes('tablet') && v.includes('desktop'))) {
    return ''
  }

  const mobile = v.includes('mobile')
  const tablet = v.includes('tablet')
  const desktop = v.includes('desktop')

  if (mobile && !tablet && !desktop) return 'block md:hidden'
  if (!mobile && tablet && !desktop) return 'hidden md:block lg:hidden'
  if (!mobile && !tablet && desktop) return 'hidden lg:block'
  if (mobile && tablet && !desktop) return 'block lg:hidden'
  if (mobile && !tablet && desktop) return 'block md:hidden lg:block'
  if (!mobile && tablet && desktop) return 'hidden md:block'

  return ''
}
