export type AppRoute = 'menu' | 'game' | 'settings' | 'leaderboard'

export function createRouter(opts: { mount: (route: AppRoute) => void }) {
  let current: AppRoute = 'menu'
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  function go(route: AppRoute) {
    current = route
    const url = route === 'menu' ? `${base}/` : `${base}/${route}`
    history.pushState({ route }, '', url)
    opts.mount(route)
  }

  window.addEventListener('popstate', (e) => {
    // Basic stripping of base path for matching
    const path = location.pathname.replace(base, '').replace(/^\//, '')
    const route = ((e.state?.route ?? (path || 'menu')) as AppRoute) || 'menu'
    current = route
    opts.mount(route)
  })

  return { go, get current() { return current } }
}
