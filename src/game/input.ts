export type KeyBinds = {
  left: string[]
  right: string[]
  softDrop: string[]
  hardDrop: string[]
  rotateCCW: string[]
  rotateCW: string[]
  hold: string[]
  pause: string[]
  restart: string[]
}

export const DEFAULT_BINDS: KeyBinds = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  softDrop: ['ArrowDown', 'KeyS'],
  hardDrop: ['Space'],
  rotateCCW: ['KeyZ'],
  rotateCW: ['KeyX', 'ArrowUp', 'KeyW'],
  hold: ['KeyC', 'ShiftLeft'],
  pause: ['Escape', 'KeyP'],
  restart: ['KeyR'],
}

export type InputState = {
  down: Set<string>
  pressed: Set<string>
  released: Set<string>
}

export function createInput() {
  const state: InputState = {
    down: new Set(),
    pressed: new Set(),
    released: new Set(),
  }

  function onKeyDown(e: KeyboardEvent) {
    // Prevent browser scroll
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault()

    if (!state.down.has(e.code)) state.pressed.add(e.code)
    state.down.add(e.code)
  }

  function onKeyUp(e: KeyboardEvent) {
    state.down.delete(e.code)
    state.released.add(e.code)
  }

  window.addEventListener('keydown', onKeyDown, { passive: false })
  window.addEventListener('keyup', onKeyUp)

  function beginFrame() {
    state.pressed.clear()
    state.released.clear()
  }

  function destroy() {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  return { state, beginFrame, destroy }
}

export function anyPressed(state: InputState, codes: string[]) {
  return codes.some((c) => state.pressed.has(c))
}

export function anyDown(state: InputState, codes: string[]) {
  return codes.some((c) => state.down.has(c))
}
