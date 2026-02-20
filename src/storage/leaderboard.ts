export type ScoreRow = {
  name: string
  mode: 'marathon' | 'sprint40' | 'ultra2m'
  score: number
  lines: number
  durationMs: number
  createdAt: number
}

const KEY = 'neon-tetris:leaderboard:v1'

export function getLeaderboard(): ScoreRow[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ScoreRow[]
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.score - a.score) : []
  } catch {
    return []
  }
}

export function submitScore(row: ScoreRow) {
  const rows = getLeaderboard()
  rows.push(row)
  rows.sort((a, b) => b.score - a.score)
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 50)))
}

export function resetLeaderboard() {
  localStorage.removeItem(KEY)
}
