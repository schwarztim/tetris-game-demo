import type { ReturnTypeOf } from '../types'
import type { createRouter } from '../router'
import { type Settings, saveSettings } from '../../storage/settings'

export function createSettingsScreen({
  router,
  settings,
}: {
  router: ReturnTypeOf<typeof createRouter>
  settings: Settings
}) {
  const el = document.createElement('div')
  el.className = 'screen settings'

  const title = document.createElement('h2')
  title.textContent = 'Options'

  const form = document.createElement('div')
  form.className = 'form'

  const mode = createSelect('Mode', [
    { value: 'marathon', label: 'Marathon (recommended)' },
    { value: 'sprint40', label: 'Sprint 40 lines' },
    { value: 'ultra2m', label: 'Ultra 2 minutes' },
  ])
  mode.value = settings.mode

  const theme = createSelect('Theme', [
    { value: 'neon', label: 'Neon' },
    { value: 'aurora', label: 'Aurora' },
    { value: 'mono', label: 'Mono' },
  ])
  theme.value = settings.theme

  const music = createToggle('Music', settings.musicEnabled)

  const track = createSelect('Music track', [
    { value: 'synth', label: 'Synth (built-in)' },
    { value: 'menu_mp3', label: 'Menu MP3' },
    { value: 'game_mp3', label: 'Game MP3' },
  ])
  track.value = settings.musicTrack

  const sfx = createToggle('SFX', settings.sfxEnabled)

  const volume = createSlider('Volume', 0, 100, settings.volume, 1)

  const das = createSlider('DAS (ms)', 50, 250, settings.das, 1)
  const arr = createSlider('ARR (ms)', 0, 60, settings.arr, 1)

  const back = document.createElement('button')
  back.className = 'btn'
  back.textContent = 'Back'
  back.addEventListener('click', () => router.go('menu'))

  const save = document.createElement('button')
  save.className = 'btn btn--primary'
  save.textContent = 'Save'
  save.addEventListener('click', () => {
    settings.mode = mode.value as Settings['mode']
    settings.theme = theme.value as Settings['theme']
    settings.musicEnabled = music.input.checked
    settings.musicTrack = track.value as Settings['musicTrack']
    settings.sfxEnabled = sfx.input.checked
    settings.volume = Number(volume.value)
    settings.das = Number(das.value)
    settings.arr = Number(arr.value)
    saveSettings(settings)
    router.go('menu')
  })

  form.append(
    mode.row,
    theme.row,
    music.row,
    track.row,
    sfx.row,
    volume.row,
    das.row,
    arr.row,
  )

  const footer = document.createElement('div')
  footer.className = 'footer'
  footer.append(back, save)

  el.append(title, form, footer)
  return el
}

function createSelect(label: string, options: Array<{ value: string; label: string }>) {
  const row = document.createElement('div')
  row.className = 'row'

  const l = document.createElement('div')
  l.className = 'row__label'
  l.textContent = label

  const select = document.createElement('select')
  select.className = 'select'
  for (const o of options) {
    const opt = document.createElement('option')
    opt.value = o.value
    opt.textContent = o.label
    select.append(opt)
  }

  row.append(l, select)
  return Object.assign(select, { row })
}

function createToggle(label: string, checked: boolean) {
  const row = document.createElement('div')
  row.className = 'row'

  const l = document.createElement('div')
  l.className = 'row__label'
  l.textContent = label

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = checked

  const wrap = document.createElement('label')
  wrap.className = 'toggle'
  wrap.append(input, document.createElement('span'))

  row.append(l, wrap)
  return { row, input }
}

function createSlider(label: string, min: number, max: number, value: number, step: number) {
  const row = document.createElement('div')
  row.className = 'row'

  const l = document.createElement('div')
  l.className = 'row__label'
  l.textContent = label

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.step = String(step)
  input.value = String(value)

  const v = document.createElement('div')
  v.className = 'row__value'
  v.textContent = String(value)
  input.addEventListener('input', () => (v.textContent = input.value))

  row.append(l, input, v)
  return Object.assign(input, { row })
}
