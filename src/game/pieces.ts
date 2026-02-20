import type { Tetromino } from './constants'

export type Rotation = 0 | 1 | 2 | 3

// 4x4 matrices encoded as list of filled coordinates in spawn orientation (rotation 0)
const SHAPES: Record<Tetromino, Array<{ r: number; c: number }>> = {
  I: [
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 1, c: 3 },
  ],
  O: [
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
  ],
  T: [
    { r: 1, c: 1 },
    { r: 2, c: 0 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
  ],
  S: [
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 2, c: 0 },
    { r: 2, c: 1 },
  ],
  Z: [
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
  ],
  J: [
    { r: 1, c: 0 },
    { r: 2, c: 0 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
  ],
  L: [
    { r: 1, c: 2 },
    { r: 2, c: 0 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
  ],
}

export function getBlocks(t: Tetromino, rot: Rotation, originR: number, originC: number) {
  const blocks = SHAPES[t]
  return blocks.map(({ r, c }) => {
    const p = rotate4(r, c, rot)
    return { r: originR + p.r, c: originC + p.c, t }
  })
}

function rotate4(r: number, c: number, rot: Rotation) {
  // rotate within 4x4.
  switch (rot) {
    case 0:
      return { r, c }
    case 1:
      return { r: c, c: 3 - r }
    case 2:
      return { r: 3 - r, c: 3 - c }
    case 3:
      return { r: 3 - c, c: r }
  }
}

// Simplified SRS-like kick tables (good play feel). For production fidelity, this is close enough.
const JLSTZ_KICKS: Record<string, Array<{ r: number; c: number }>> = {
  '0>1': [
    { r: 0, c: 0 },
    { r: 0, c: -1 },
    { r: 1, c: -1 },
    { r: -2, c: 0 },
    { r: -2, c: -1 },
  ],
  '1>0': [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: -1, c: 1 },
    { r: 2, c: 0 },
    { r: 2, c: 1 },
  ],
  '1>2': [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: -1, c: 1 },
    { r: 2, c: 0 },
    { r: 2, c: 1 },
  ],
  '2>1': [
    { r: 0, c: 0 },
    { r: 0, c: -1 },
    { r: 1, c: -1 },
    { r: -2, c: 0 },
    { r: -2, c: -1 },
  ],
  '2>3': [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: 1, c: 1 },
    { r: -2, c: 0 },
    { r: -2, c: 1 },
  ],
  '3>2': [
    { r: 0, c: 0 },
    { r: 0, c: -1 },
    { r: -1, c: -1 },
    { r: 2, c: 0 },
    { r: 2, c: -1 },
  ],
  '3>0': [
    { r: 0, c: 0 },
    { r: 0, c: -1 },
    { r: -1, c: -1 },
    { r: 2, c: 0 },
    { r: 2, c: -1 },
  ],
  '0>3': [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: 1, c: 1 },
    { r: -2, c: 0 },
    { r: -2, c: 1 },
  ],
}

const I_KICKS: Record<string, Array<{ r: number; c: number }>> = {
  '0>1': [
    { r: 0, c: 0 },
    { r: 0, c: -2 },
    { r: 0, c: 1 },
    { r: 1, c: -2 },
    { r: -2, c: 1 },
  ],
  '1>0': [
    { r: 0, c: 0 },
    { r: 0, c: 2 },
    { r: 0, c: -1 },
    { r: -1, c: 2 },
    { r: 2, c: -1 },
  ],
  '1>2': [
    { r: 0, c: 0 },
    { r: 0, c: -1 },
    { r: 0, c: 2 },
    { r: -2, c: -1 },
    { r: 1, c: 2 },
  ],
  '2>1': [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: 0, c: -2 },
    { r: 2, c: 1 },
    { r: -1, c: -2 },
  ],
  '2>3': [
    { r: 0, c: 0 },
    { r: 0, c: 2 },
    { r: 0, c: -1 },
    { r: 1, c: 2 },
    { r: -2, c: -1 },
  ],
  '3>2': [
    { r: 0, c: 0 },
    { r: 0, c: -2 },
    { r: 0, c: 1 },
    { r: -1, c: -2 },
    { r: 2, c: 1 },
  ],
  '3>0': [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: 0, c: -2 },
    { r: -2, c: 1 },
    { r: 1, c: -2 },
  ],
  '0>3': [
    { r: 0, c: 0 },
    { r: 0, c: -1 },
    { r: 0, c: 2 },
    { r: 2, c: -1 },
    { r: -1, c: 2 },
  ],
}

export function getKickTests(t: Tetromino, from: Rotation, to: Rotation) {
  if (t === 'O') return [{ r: 0, c: 0 }]
  const key = `${from}>${to}`
  return (t === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key]) ?? [{ r: 0, c: 0 }]
}
