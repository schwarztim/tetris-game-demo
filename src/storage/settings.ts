export type Settings = {
  mode: 'marathon' | 'sprint40' | 'ultra2m'
  theme: 'neon' | 'aurora' | 'mono'

  musicEnabled: boolean
  musicTrack: 'synth' | 'menu_mp3' | 'game_mp3'
  sfxEnabled: boolean
  volume: number

  das: number
  arr: number
}

const KEY = 'neon-tetris:settings:v1'

export function loadSettings(): Settings {
  const raw = localStorage.getItem(KEY)
  if (!raw) return defaults()
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...defaults(),
      ...parsed,
    }
  } catch {
    return defaults()
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

function defaults(): Settings {
  return {
    mode: 'marathon',
    theme: 'neon',
    musicEnabled: true,
    musicTrack: 'synth',
    sfxEnabled: true,
    volume: 70,
    das: 120,
    arr: 20,
  }
}
