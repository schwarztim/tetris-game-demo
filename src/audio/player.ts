import menuUrl from '../assets/menumusic.mp3'
import gameUrl from '../assets/gamemusic.mp3'

export type MusicSource = 'synth' | 'menu_mp3' | 'game_mp3' | 'off'

let audio: HTMLAudioElement | null = null
let currentUrl: string | null = null

export function playMusic(src: MusicSource, volume01: number) {
  if (src === 'synth') return
  if (src === 'off') {
    stopMusic()
    return
  }

  const url = src === 'menu_mp3' ? menuUrl : gameUrl

  if (!audio) {
    audio = new Audio()
    audio.loop = true
    audio.preload = 'auto'
  }

  audio.volume = clamp(volume01, 0, 1)

  if (currentUrl !== url) {
    currentUrl = url
    audio.src = url
  }

  // best-effort; browsers may require a gesture (we call after ensureAudioBooted() on click)
  void audio.play().catch(() => {})
}

export function setMusicVolume(volume01: number) {
  if (!audio) return
  audio.volume = clamp(volume01, 0, 1)
}

export function stopMusic() {
  if (!audio) return
  try {
    audio.pause()
  } catch {}
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
