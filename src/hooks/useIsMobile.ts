export const useIsMobile = () => {
  if (typeof window === 'undefined') return false

  const isMobile = window.matchMedia('(max-width: 767px)').matches
  return isMobile
}
