export const COLS = 10
export const ROWS = 20
export const SPAWN_ROW = -2

export type Tetromino = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export const TETROMINOS: Tetromino[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

export type Cell = 0 | Tetromino

export const COLORS: Record<Tetromino, string> = {
  I: '#4de8ff',
  O: '#ffe55c',
  T: '#b46bff',
  S: '#54ff8a',
  Z: '#ff4d6d',
  J: '#4d7dff',
  L: '#ff9a4d',
}

export const SCORE_LINE_CLEAR = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
} as const

export function levelToGravityMs(level: number) {
  // Arcade-ish curve, tuned for web play.
  const base = 1000
  const min = 80
  const factor = Math.pow(0.85, Math.max(0, level - 1))
  return Math.max(min, Math.floor(base * factor))
}
