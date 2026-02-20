import { createGameScreen } from './screens/game'
import { createMenuScreen } from './screens/menu'
import { createSettingsScreen } from './screens/settings'
import { createLeaderboardScreen } from './screens/leaderboard'
import { type AppRoute, createRouter } from './router'
import { loadSettings } from '../storage/settings'

export function mountApp(root: HTMLElement) {
  root.innerHTML = ''
  root.classList.add('app-root')

  const settings = loadSettings()

  const appShell = document.createElement('div')
  appShell.className = 'app-shell'

  const bg = document.createElement('div')
  bg.className = 'bg'

  const crt = document.createElement('div')
  crt.className = 'crt'

  const view = document.createElement('div')
  view.className = 'view'

  appShell.append(bg, crt, view)
  root.append(appShell)

  const router = createRouter({
    mount(route: AppRoute) {
      view.innerHTML = ''
      switch (route) {
        case 'menu':
          view.append(createMenuScreen({ router, settings }))
          break
        case 'game':
          view.append(createGameScreen({ router, settings }))
          break
        case 'settings':
          view.append(createSettingsScreen({ router, settings }))
          break
        case 'leaderboard':
          view.append(createLeaderboardScreen({ router }))
          break
      }
    },
  })

  router.go('menu')
}
