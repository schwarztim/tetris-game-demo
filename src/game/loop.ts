import { anyDown, anyPressed, createInput, DEFAULT_BINDS } from './input'
import { createGameState, getGhost, hardDrop, hold, move, rotate, setPaused, tick, tryLockIfGrounded, type GameMode, type GameState } from './state'

export type Events = {
  onLineClear?: (lines: number, isTetris: boolean) => void
  onHardDrop?: () => void
  onRotate?: () => void
  onMove?: () => void
  onHold?: () => void
  onGameOver?: () => void
}

export function startGame(mode: GameMode, opts: { dasMs: number; arrMs: number }, events: Events) {
  let state = createGameState(mode)
  const input = createInput()

  let raf = 0
  let last = performance.now()

  // DAS/ARR handling
  let leftHeldMs = 0
  let rightHeldMs = 0
  let leftRepeatMs = 0
  let rightRepeatMs = 0

  function frame(now: number) {
    const dt = Math.min(50, now - last)
    last = now

    // One-shot inputs
    if (anyPressed(input.state, DEFAULT_BINDS.pause)) {
      setPaused(state, state.status !== 'paused')
    }

    if (anyPressed(input.state, DEFAULT_BINDS.restart)) {
      state = createGameState(mode)
    }

    if (state.status !== 'paused') {
      if (anyPressed(input.state, DEFAULT_BINDS.rotateCW)) {
        if (rotate(state, 1)) events.onRotate?.()
      }
      if (anyPressed(input.state, DEFAULT_BINDS.rotateCCW)) {
        if (rotate(state, -1)) events.onRotate?.()
      }
      if (anyPressed(input.state, DEFAULT_BINDS.hardDrop)) {
        hardDrop(state)
        events.onHardDrop?.()
      }
      if (anyPressed(input.state, DEFAULT_BINDS.hold)) {
        hold(state)
        events.onHold?.()
      }

      // Horizontal with DAS/ARR
      const leftDown = anyDown(input.state, DEFAULT_BINDS.left)
      const rightDown = anyDown(input.state, DEFAULT_BINDS.right)

      if (leftDown && !rightDown) {
        leftHeldMs += dt
        rightHeldMs = 0
        rightRepeatMs = 0

        if (anyPressed(input.state, DEFAULT_BINDS.left)) {
          if (move(state, -1)) events.onMove?.()
        }

        if (leftHeldMs >= opts.dasMs) {
          leftRepeatMs += dt
          const step = Math.max(0, opts.arrMs)
          if (step === 0) {
            // infinite move until blocked
            while (move(state, -1)) events.onMove?.()
            leftRepeatMs = 0
          } else {
            while (leftRepeatMs >= step) {
              leftRepeatMs -= step
              if (!move(state, -1)) break
              events.onMove?.()
            }
          }
        }
      } else {
        leftHeldMs = 0
        leftRepeatMs = 0
      }

      if (rightDown && !leftDown) {
        rightHeldMs += dt
        leftHeldMs = 0
        leftRepeatMs = 0

        if (anyPressed(input.state, DEFAULT_BINDS.right)) {
          if (move(state, 1)) events.onMove?.()
        }

        if (rightHeldMs >= opts.dasMs) {
          rightRepeatMs += dt
          const step = Math.max(0, opts.arrMs)
          if (step === 0) {
            while (move(state, 1)) events.onMove?.()
            rightRepeatMs = 0
          } else {
            while (rightRepeatMs >= step) {
              rightRepeatMs -= step
              if (!move(state, 1)) break
              events.onMove?.()
            }
          }
        }
      } else {
        rightHeldMs = 0
        rightRepeatMs = 0
      }

      // Soft drop held
      if (anyDown(input.state, DEFAULT_BINDS.softDrop)) {
        // mimic faster tick via extra dt into state
        tick(state, dt * 2)
      } else {
        tick(state, dt)
      }

      // lock delay when grounded
      tryLockIfGrounded(state, dt)

      if (state.lastClear.lines) {
        events.onLineClear?.(state.lastClear.lines, state.lastClear.tetris)
        state.lastClear = { lines: 0, tetris: false }
      }

      if (state.status === 'over') events.onGameOver?.()
    }

    input.beginFrame()
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)

  function stop() {
    cancelAnimationFrame(raf)
    input.destroy()
  }

  function getState(): GameState {
    return state
  }

  return { stop, getState, getGhost }
}
