import { COLS, ROWS, type Cell, type Tetromino } from './constants'

export type Board = Cell[][]

export function createEmptyBoard(): Board {
  const b: Board = []
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = []
    for (let c = 0; c < COLS; c++) row.push(0)
    b.push(row)
  }
  return b
}

export function cloneBoard(board: Board): Board {
  return board.map((r) => r.slice()) as Board
}

export function inBounds(r: number, c: number) {
  return c >= 0 && c < COLS && r < ROWS
}

export function boardGet(board: Board, r: number, c: number): Cell {
  if (!inBounds(r, c) || r < 0) return 0
  return board[r]![c]!
}

export function boardSet(board: Board, r: number, c: number, v: Cell) {
  if (!inBounds(r, c) || r < 0) return
  board[r]![c] = v
}

export function merge(board: Board, blocks: Array<{ r: number; c: number; t: Tetromino }>) {
  for (const b of blocks) boardSet(board, b.r, b.c, b.t)
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  let cleared = 0
  const out: Board = []

  for (let r = ROWS - 1; r >= 0; r--) {
    const row = board[r]!
    const full = row.every((x) => x !== 0)
    if (full) {
      cleared++
    } else {
      out.unshift(row.slice() as Cell[])
    }
  }

  while (out.length < ROWS) {
    const empty: Cell[] = []
    for (let c = 0; c < COLS; c++) empty.push(0)
    out.unshift(empty)
  }

  return { board: out, cleared }
}
