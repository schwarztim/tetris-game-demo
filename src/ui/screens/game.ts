import type { ReturnTypeOf } from '../types'
import type { createRouter } from '../router'
import type { Settings } from '../../storage/settings'
import { startGame } from '../../game/loop'
import { COLORS, type Tetromino } from '../../game/constants'
import { getBlocks } from '../../game/pieces'
import { submitScore } from '../../storage/leaderboard'
import { ensureAudioBooted, setMasterVolume, sfx, startMusic, stopSynthMusic, isSynthPlaying } from '../../audio/synth'
import { playMusic, stopMusic as stopMp3Music, audioPlaying } from '../../audio/player'

export function createGameScreen({
  router,
  settings,
}: {
  router: ReturnTypeOf<typeof createRouter>
  settings: Settings
}) {
  const el = document.createElement('div')
  el.className = `screen game theme--${settings.theme}`

  const header = document.createElement('div')
  header.className = 'game__header'
  header.innerHTML = `
    <div class="brand">NEON TETRIS</div>
    <div class="meta">Z/X rotate · C hold · Space hard drop · Esc pause</div>
  `

  const layout = document.createElement('div')
  layout.className = 'game__layout'

  const left = document.createElement('div')
  left.className = 'side'

  const right = document.createElement('div')
  right.className = 'side'

  const center = document.createElement('div')
  center.className = 'center'

  const boardWrap = document.createElement('div')
  boardWrap.className = 'board-wrap'

  const canvas = document.createElement('canvas')
  canvas.width = 420
  canvas.height = 840
  canvas.className = 'board'

  const overlay = document.createElement('div')
  overlay.className = 'overlay'

  boardWrap.append(canvas, overlay)
  center.append(boardWrap)

  const hud = document.createElement('div')
  hud.className = 'hud'

  const stats = document.createElement('div')
  stats.className = 'stats'

  const statScore = stat('Score')
  const statLines = stat('Lines')
  const statLevel = stat('Level')
  const statTime = stat('Time')

  stats.append(statScore.el, statLines.el, statLevel.el, statTime.el)

  const miniHold = miniPanel('Hold')
  const miniNext = miniPanel('Next')

  left.append(miniHold.el, stats)
  right.append(miniNext.el)

  const controls = document.createElement('div')
  controls.className = 'controls'

  const back = document.createElement('button')
  back.className = 'btn'
  back.textContent = 'Menu'
  back.addEventListener('click', () => {
    stopSynthMusic()
    stopMp3Music()
    loop.stop()
    router.go('menu')
  })

  const restart = document.createElement('button')
  restart.className = 'btn'
  restart.textContent = 'Restart'
  restart.addEventListener('click', () => {
    // keybind is R, but button for convenience
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))
  })

  const mute = document.createElement('button')
  mute.className = 'btn'
  mute.textContent = settings.musicEnabled || settings.sfxEnabled ? 'Audio: On' : 'Audio: Off'
  mute.addEventListener('click', () => {
    settings.musicEnabled = !settings.musicEnabled
    settings.sfxEnabled = settings.musicEnabled
    mute.textContent = settings.musicEnabled ? 'Audio: On' : 'Audio: Off'

    if (!settings.musicEnabled) {
      stopSynthMusic()
      stopMp3Music()
      return
    }

    const volume01 = settings.volume / 100
    if (settings.musicTrack === 'synth') {
      stopMp3Music()
      setMasterVolume(volume01)
      startMusic()
    } else {
      stopSynthMusic()
      playMusic('game_mp3', volume01)
    }
  })

  controls.append(back, restart, mute)

  hud.append(stats, controls)

  layout.append(left, center, right)

  el.append(header, layout)

  const ctx = canvas.getContext('2d')!

  const loop = startGame(settings.mode, { dasMs: settings.das, arrMs: settings.arr }, {
    onLineClear(lines, isTetris) {
      if (settings.sfxEnabled) sfx(isTetris ? 'tetris' : 'clear')
      pulseOverlay(isTetris ? 'TETRIS!' : `${lines} LINE${lines > 1 ? 'S' : ''}`)
    },
    onHardDrop() {
      if (settings.sfxEnabled) sfx('drop')
    },
    onRotate() {
      if (settings.sfxEnabled) sfx('rotate')
    },
    onMove() {
      // subtle tick could be too much; omit
    },
    onHold() {
      if (settings.sfxEnabled) sfx('hold')
    },
    onGameOver() {
      if (settings.sfxEnabled) sfx('gameover')
      showGameOver()
    },
  })

  ;(async () => {
    await ensureAudioBooted()

    // Ensure we don't have overlapping playback when entering the game.
    stopSynthMusic()
    stopMp3Music()

    if (!settings.musicEnabled) return

    const volume01 = settings.volume / 100
    if (settings.musicTrack === 'synth') {
      setMasterVolume(volume01)
      startMusic()
    } else {
      playMusic('game_mp3', volume01)
    }
  })()

  let anim = 0

  function render(_now: number) {

    const state: any = loop.getState() as any
    state.__ghost = loop.getGhost(state)

    statScore.value.textContent = String(state.score)
    statLines.value.textContent = String(state.lines)
    statLevel.value.textContent = String(state.level)
    statTime.value.textContent = formatMs(state.elapsedMs)

    miniHold.draw(state.hold)
    miniNext.draw(state.queue.slice(0, 5))

    overlay.classList.toggle('overlay--paused', state.status === 'paused')

    drawBoard(ctx, state.board)
    drawGhost(ctx, state)
    drawActive(ctx, state)

    if (state.status === 'paused') {
      overlay.innerHTML = `<div class="overlay__card"><div class="overlay__title">PAUSED</div><div class="overlay__sub">Press Esc to resume</div></div>`
      // Only stop if they were playing
      if (isSynthPlaying()) stopSynthMusic()
      if (audioPlaying()) stopMp3Music()
    } else if (state.status !== 'over') {
      if (settings.musicEnabled) {
        const volume01 = settings.volume / 100
        if (settings.musicTrack === 'synth') {
          if (!isSynthPlaying()) {
            setMasterVolume(volume01)
            startMusic()
          }
        } else {
          if (!audioPlaying()) {
            stopSynthMusic()
            playMusic('game_mp3', volume01)
          }
        }
      }
      // keep transient messages only
      if (!overlay.dataset.locked) overlay.innerHTML = ''
    }

    anim = requestAnimationFrame(render)
  }

  function showGameOver() {
    overlay.dataset.locked = '1'
    const state = loop.getState()
    overlay.innerHTML = `
      <div class="overlay__card">
        <div class="overlay__title">GAME OVER</div>
        <div class="overlay__sub">Score ${state.score} · Lines ${state.lines} · ${formatMs(state.elapsedMs)}</div>
        <div class="overlay__actions">
          <button class="btn btn--primary" data-action="submit">Submit Score</button>
          <button class="btn" data-action="again">Play Again</button>
          <button class="btn" data-action="menu">Menu</button>
        </div>
      </div>
    `

    overlay.querySelector('[data-action="again"]')!.addEventListener('click', () => {
      overlay.dataset.locked = ''
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))
    })

    overlay.querySelector('[data-action="menu"]')!.addEventListener('click', () => {
      stopSynthMusic()
      stopMp3Music()
      loop.stop()
      router.go('menu')
    })

    overlay.querySelector('[data-action="submit"]')!.addEventListener('click', () => {
      const name = prompt('Name for leaderboard?', 'PLAYER')?.slice(0, 16) ?? 'PLAYER'
      submitScore({
        name: name || 'PLAYER',
        mode: state.mode,
        score: state.score,
        lines: state.lines,
        durationMs: Math.floor(state.elapsedMs),
        createdAt: Date.now(),
      })
      router.go('leaderboard')
    })
  }

  function pulseOverlay(text: string) {
    if (overlay.dataset.locked) return
    overlay.innerHTML = `<div class="toast">${text}</div>`
    overlay.classList.remove('overlay--toast')
    void overlay.offsetWidth
    overlay.classList.add('overlay--toast')
    setTimeout(() => {
      if (overlay.dataset.locked) return
      overlay.innerHTML = ''
      overlay.classList.remove('overlay--toast')
    }, 900)
  }

  anim = requestAnimationFrame(render)

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(anim)
    loop.stop()
    stopSynthMusic()
    stopMp3Music()
  })

  return el
}

function stat(label: string) {
  const el = document.createElement('div')
  el.className = 'stat'
  const l = document.createElement('div')
  l.className = 'stat__label'
  l.textContent = label
  const value = document.createElement('div')
  value.className = 'stat__value'
  value.textContent = '0'
  el.append(l, value)
  return { el, value }
}

function miniPanel(title: string) {
  const el = document.createElement('div')
  el.className = 'mini'
  const h = document.createElement('div')
  h.className = 'mini__title'
  h.textContent = title

  const canvas = document.createElement('canvas')
  canvas.width = 180
  canvas.height = 240
  canvas.className = 'mini__canvas'
  const ctx = canvas.getContext('2d')!

  el.append(h, canvas)

  function drawHold(t: Tetromino | null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!t) return
    drawMiniPiece(ctx, t, 0, 0)
  }

  function drawQueue(ts: Tetromino[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ts.forEach((t, i) => drawMiniPiece(ctx, t, 0, i * 80))
  }

  return {
    el,
    draw(payload: Tetromino | null | Tetromino[]) {
      if (Array.isArray(payload)) drawQueue(payload)
      else drawHold(payload)
    },
  }
}

function drawMiniPiece(ctx: CanvasRenderingContext2D, t: Tetromino, x: number, y: number) {
  const blocks = getBlocks(t, 0, 0, 0)
  const minR = Math.min(...blocks.map((b) => b.r))
  const minC = Math.min(...blocks.map((b) => b.c))

  const size = 24
  const ox = x + 18
  const oy = y + 18

  for (const b of blocks) {
    const r = b.r - minR
    const c = b.c - minC
    drawCell(ctx, ox + c * size, oy + r * size, size, COLORS[t], 0.9)
  }
}

function drawBoard(ctx: CanvasRenderingContext2D, board: Array<Array<0 | Tetromino>>) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const cell = ctx.canvas.width / 10

  // background grid
  ctx.save()
  ctx.globalAlpha = 0.2
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 10; c++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.strokeRect(c * cell + 0.5, r * cell + 0.5, cell - 1, cell - 1)
    }
  }
  ctx.restore()

  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 10; c++) {
      const v = board[r]![c]!
      if (!v) continue
      drawCell(ctx, c * cell, r * cell, cell, COLORS[v], 1)
    }
  }
}

function drawGhost(ctx: CanvasRenderingContext2D, state: any) {
  const cell = ctx.canvas.width / 10
  const ghost = state.__ghost as { t: Tetromino; r: number; c: number; rot: number } | undefined
  if (!ghost) return

  const blocks = getBlocks(ghost.t, ghost.rot as any, ghost.r, ghost.c)
  for (const b of blocks) {
    if (b.r < 0) continue
    drawCell(ctx, b.c * cell, b.r * cell, cell, COLORS[ghost.t], 0.25)
  }
}

function drawActive(ctx: CanvasRenderingContext2D, state: any) {
  const cell = ctx.canvas.width / 10
  const t = state.active.t as Tetromino
  const blocks = getBlocks(t, state.active.rot as any, state.active.r, state.active.c)
  for (const b of blocks) {
    if (b.r < 0) continue
    drawCell(ctx, b.c * cell, b.r * cell, cell, COLORS[t], 1)
  }
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha

  // glow
  ctx.shadowColor = color
  ctx.shadowBlur = 18

  const pad = 2
  const w = s - pad * 2

  const grad = ctx.createLinearGradient(x, y, x + s, y + s)
  grad.addColorStop(0, shade(color, 1.2))
  grad.addColorStop(1, shade(color, 0.9))

  ctx.fillStyle = grad
  roundRect(ctx, x + pad, y + pad, w, w, 8)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 1
  roundRect(ctx, x + pad + 0.5, y + pad + 0.5, w - 1, w - 1, 8)
  ctx.stroke()

  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function shade(hex: string, mult: number) {
  const n = hex.replace('#', '')
  const r = clamp(Math.floor(parseInt(n.slice(0, 2), 16) * mult), 0, 255)
  const g = clamp(Math.floor(parseInt(n.slice(2, 4), 16) * mult), 0, 255)
  const b = clamp(Math.floor(parseInt(n.slice(4, 6), 16) * mult), 0, 255)
  return `rgb(${r},${g},${b})`
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
