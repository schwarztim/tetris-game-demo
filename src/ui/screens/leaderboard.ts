import type { ReturnTypeOf } from '../types'
import type { createRouter } from '../router'
import { getLeaderboard, resetLeaderboard } from '../../storage/leaderboard'

export function createLeaderboardScreen({ router }: { router: ReturnTypeOf<typeof createRouter> }) {
  const el = document.createElement('div')
  el.className = 'screen leaderboard'

  const title = document.createElement('h2')
  title.textContent = 'Leaderboard'

  const table = document.createElement('div')
  table.className = 'table'

  const rows = getLeaderboard()

  const header = document.createElement('div')
  header.className = 'table__row table__row--header'
  header.innerHTML = `<div>#</div><div>Name</div><div>Mode</div><div>Score</div><div>Lines</div><div>Time</div>`
  table.append(header)

  rows.slice(0, 10).forEach((r, idx) => {
    const row = document.createElement('div')
    row.className = 'table__row'
    row.innerHTML = `<div>${idx + 1}</div><div>${escapeHtml(r.name)}</div><div>${r.mode}</div><div>${r.score}</div><div>${r.lines}</div><div>${formatMs(r.durationMs)}</div>`
    table.append(row)
  })

  if (rows.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty'
    empty.textContent = 'No scores yet. Play a game to set your first record.'
    table.append(empty)
  }

  const footer = document.createElement('div')
  footer.className = 'footer'

  const back = document.createElement('button')
  back.className = 'btn'
  back.textContent = 'Back'
  back.addEventListener('click', () => router.go('menu'))

  const reset = document.createElement('button')
  reset.className = 'btn'
  reset.textContent = 'Reset'
  reset.addEventListener('click', () => {
    resetLeaderboard()
    router.go('leaderboard')
  })

  footer.append(back, reset)

  el.append(title, table, footer)
  return el
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
