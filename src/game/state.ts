import { createEmptyBoard, clearLines, merge } from './board'
import {
  COLS,
  ROWS,
  SCORE_LINE_CLEAR,
  SPAWN_ROW,
  type Tetromino,
  levelToGravityMs,
} from './constants'
import { BagRandom } from './random'
import { getBlocks, getKickTests, type Rotation } from './pieces'

export type GameMode = 'marathon' | 'sprint40' | 'ultra2m'

export type GameStatus = 'playing' | 'paused' | 'over'

export type ActivePiece = {
  t: Tetromino
  r: number
  c: number
  rot: Rotation
}

export type GameState = {
  mode: GameMode
  status: GameStatus

  board: ReturnType<typeof createEmptyBoard>
  rng: BagRandom

  active: ActivePiece
  hold: Tetromino | null
  holdUsed: boolean

  queue: Tetromino[]

  score: number
  lines: number
  level: number

  startMs: number
  elapsedMs: number

  gravityMs: number
  dropAccMs: number
  lockAccMs: number
  lockDelayMs: number

  goalLines: number
  timeLimitMs: number

  lastClear: { lines: number; tetris: boolean }
}

export function createGameState(mode: GameMode): GameState {
  const rng = new BagRandom()
  const queue: Tetromino[] = []
  for (let i = 0; i < 5; i++) queue.push(rng.next())

  const active = spawn(queue, rng)

  const startMs = performance.now()

  return {
    mode,
    status: 'playing',
    board: createEmptyBoard(),
    rng,
    active,
    hold: null,
    holdUsed: false,
    queue,
    score: 0,
    lines: 0,
    level: 1,
    startMs,
    elapsedMs: 0,
    gravityMs: levelToGravityMs(1),
    dropAccMs: 0,
    lockAccMs: 0,
    lockDelayMs: 500,
    goalLines: mode === 'sprint40' ? 40 : 0,
    timeLimitMs: mode === 'ultra2m' ? 2 * 60_000 : 0,
    lastClear: { lines: 0, tetris: false },
  }
}

function spawn(queue: Tetromino[], rng: BagRandom): ActivePiece {
  while (queue.length < 5) queue.push(rng.next())
  const t = queue.shift()!
  const c = Math.floor(COLS / 2) - 2
  return { t, r: SPAWN_ROW, c, rot: 0 }
}

export function getGhost(state: GameState): ActivePiece {
  let r = state.active.r
  while (canPlace(state, { ...state.active, r: r + 1 })) r++
  return { ...state.active, r }
}

export function tick(state: GameState, dtMs: number) {
  if (state.status !== 'playing') return

  state.elapsedMs = performance.now() - state.startMs
  if (state.timeLimitMs && state.elapsedMs >= state.timeLimitMs) {
    state.status = 'over'
    return
  }

  state.dropAccMs += dtMs

  const gravity = state.gravityMs
  while (state.dropAccMs >= gravity) {
    state.dropAccMs -= gravity
    if (!softDropStep(state)) break
  }
}

export function setPaused(state: GameState, paused: boolean) {
  if (state.status === 'over') return
  state.status = paused ? 'paused' : 'playing'
  if (!paused) {
    // reset accumulators to avoid multi-step jumps on resume
    state.dropAccMs = 0
    state.lockAccMs = 0
  }
}

export function move(state: GameState, dc: number) {
  if (state.status !== 'playing') return false
  const next = { ...state.active, c: state.active.c + dc }
  if (!canPlace(state, next)) return false
  state.active = next
  state.lockAccMs = 0
  return true
}

export function rotate(state: GameState, dir: -1 | 1) {
  if (state.status !== 'playing') return false
  const from = state.active.rot
  const to = (((from + dir + 4) % 4) as Rotation)

  for (const k of getKickTests(state.active.t, from, to)) {
    const next = { ...state.active, rot: to, r: state.active.r + k.r, c: state.active.c + k.c }
    if (canPlace(state, next)) {
      state.active = next
      state.lockAccMs = 0
      return true
    }
  }

  return false
}

export function hardDrop(state: GameState) {
  if (state.status !== 'playing') return
  let dropped = 0
  while (canPlace(state, { ...state.active, r: state.active.r + 1 })) {
    state.active = { ...state.active, r: state.active.r + 1 }
    dropped++
  }
  if (dropped > 0) state.score += dropped * 2
  lock(state)
}

export function softDrop(state: GameState, dtMs: number) {
  if (state.status !== 'playing') return
  // Accelerate gravity while held by calling this in input handler.
  const stepEvery = 25
  state.dropAccMs += dtMs
  while (state.dropAccMs >= stepEvery) {
    state.dropAccMs -= stepEvery
    softDropStep(state, true)
  }
}

function softDropStep(state: GameState, scoring = false) {
  const next = { ...state.active, r: state.active.r + 1 }
  if (canPlace(state, next)) {
    state.active = next
    if (scoring) state.score += 1
    return true
  }

  state.lockAccMs += state.gravityMs
  if (state.lockAccMs >= state.lockDelayMs) lock(state)
  return false
}

export function hold(state: GameState) {
  if (state.status !== 'playing') return
  if (state.holdUsed) return

  const cur = state.active.t
  if (state.hold == null) {
    state.hold = cur
    state.active = spawn(state.queue, state.rng)
  } else {
    const swap = state.hold
    state.hold = cur
    state.active = { t: swap, r: SPAWN_ROW, c: Math.floor(COLS / 2) - 2, rot: 0 }
    if (!canPlace(state, state.active)) {
      state.status = 'over'
      return
    }
  }
  state.holdUsed = true
  state.lockAccMs = 0
  state.dropAccMs = 0
}

export function tryLockIfGrounded(state: GameState, dtMs: number) {
  if (state.status !== 'playing') return
  const below = { ...state.active, r: state.active.r + 1 }
  if (canPlace(state, below)) return

  state.lockAccMs += dtMs
  if (state.lockAccMs >= state.lockDelayMs) lock(state)
}

function lock(state: GameState) {
  const blocks = getBlocks(state.active.t, state.active.rot, state.active.r, state.active.c)
  merge(state.board, blocks)

  const cleared = clearLines(state.board)
  state.board = cleared.board

  if (cleared.cleared > 0) {
    const base = SCORE_LINE_CLEAR[cleared.cleared as 1 | 2 | 3 | 4] ?? 0
    const add = base * state.level
    state.score += add
    state.lines += cleared.cleared
    state.lastClear = { lines: cleared.cleared, tetris: cleared.cleared === 4 }

    if (state.mode === 'sprint40' && state.lines >= state.goalLines) {
      state.status = 'over'
      return
    }

    const nextLevel = 1 + Math.floor(state.lines / 10)
    if (nextLevel !== state.level) {
      state.level = nextLevel
      state.gravityMs = levelToGravityMs(state.level)
    }
  } else {
    state.lastClear = { lines: 0, tetris: false }
  }

  state.holdUsed = false
  state.lockAccMs = 0
  state.dropAccMs = 0

  state.active = spawn(state.queue, state.rng)
  if (!canPlace(state, state.active)) {
    state.status = 'over'
  }
}

function canPlace(state: GameState, piece: ActivePiece) {
  const blocks = getBlocks(piece.t, piece.rot, piece.r, piece.c)
  for (const b of blocks) {
    if (b.c < 0 || b.c >= COLS || b.r >= ROWS) return false
    if (b.r >= 0 && state.board[b.r]![b.c]! !== 0) return false
  }
  return true
}
