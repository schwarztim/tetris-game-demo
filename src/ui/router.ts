export type AppRoute = 'menu' | 'game' | 'settings' | 'leaderboard'

export function createRouter(opts: { mount: (route: AppRoute) => void }) {
  let current: AppRoute = 'menu'

  function go(route: AppRoute) {
    current = route
    history.pushState({ route }, '', route === 'menu' ? '/' : `/${route}`)
    opts.mount(route)
  }

  window.addEventListener('popstate', (e) => {
    const route = ((e.state?.route ?? (location.pathname.replace('/', '') || 'menu')) as AppRoute) || 'menu'
    current = route
    opts.mount(route)
  })

  return { go, get current() { return current } }
}
