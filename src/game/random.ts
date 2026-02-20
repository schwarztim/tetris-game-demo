import { TETROMINOS, type Tetromino } from './constants'

export class BagRandom {
  private bag: Tetromino[] = []

  next(): Tetromino {
    if (this.bag.length === 0) {
      this.bag = shuffle(TETROMINOS.slice())
    }
    return this.bag.pop()!
  }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
