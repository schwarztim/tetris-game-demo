import type { ReturnTypeOf } from '../types'
import type { createRouter } from '../router'
import type { Settings } from '../../storage/settings'
import { ensureAudioBooted, startMusic, stopSynthMusic, setMasterVolume } from '../../audio/synth'
import { playMusic, stopMusic as stopMp3Music } from '../../audio/player'

export function createMenuScreen({
  router,
  settings,
}: {
  router: ReturnTypeOf<typeof createRouter>
  settings: Settings
}) {
  const el = document.createElement('div')
  el.className = 'screen menu'

  ;(async () => {
    await ensureAudioBooted()

    // Ensure we don't have overlapping playback when returning from the game.
    stopSynthMusic()
    stopMp3Music()

    if (!settings.musicEnabled) return

    const volume01 = settings.volume / 100
    if (settings.musicTrack === 'synth') {
      setMasterVolume(volume01)
      startMusic()
    } else {
      // Menu always uses the menu track when MP3 playback is selected.
      playMusic('menu_mp3', volume01)
    }
  })()

  const title = document.createElement('div')
  title.className = 'title'
  title.innerHTML = `
    <div class="title__top">NEON</div>
    <div class="title__main">TETRIS</div>
    <div class="title__sub">Production build · modes · audio · leaderboard</div>
  `

  const panel = document.createElement('div')
  panel.className = 'panel'

  const primary = document.createElement('button')
  primary.className = 'btn btn--primary'
  primary.textContent = 'PLAY'
  primary.addEventListener('click', async () => {
    await ensureAudioBooted()
    router.go('game')
  })

  const options = document.createElement('button')
  options.className = 'btn'
  options.textContent = 'OPTIONS'
  options.addEventListener('click', () => router.go('settings'))

  const leaderboard = document.createElement('button')
  leaderboard.className = 'btn'
  leaderboard.textContent = 'LEADERBOARD'
  leaderboard.addEventListener('click', () => router.go('leaderboard'))

  const hint = document.createElement('div')
  hint.className = 'hint'
  hint.innerHTML = `
    <div class="kbd">
      <div><span>Move</span><kbd>←</kbd><kbd>→</kbd></div>
      <div><span>Rotate</span><kbd>Z</kbd><kbd>X</kbd></div>
      <div><span>Soft/Hard</span><kbd>↓</kbd><kbd>Space</kbd></div>
      <div><span>Hold</span><kbd>C</kbd></div>
      <div><span>Pause</span><kbd>Esc</kbd></div>
    </div>
    <div class="small">Tip: click PLAY once to enable audio in-browser.</div>
  `

  panel.append(primary, options, leaderboard)
  el.append(title, panel, hint)
  return el
}
