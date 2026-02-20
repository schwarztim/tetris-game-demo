type SfxName = 'rotate' | 'drop' | 'clear' | 'tetris' | 'hold' | 'gameover'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicGain: GainNode | null = null
let musicOscs: OscillatorNode[] = []
let musicTimer = 0

export async function ensureAudioBooted() {
  if (ctx) return
  const AC = window.AudioContext || (window as any).webkitAudioContext
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.7
  master.connect(ctx.destination)

  musicGain = ctx.createGain()
  musicGain.gain.value = 0.35
  musicGain.connect(master)

  // unlock on user gesture
  if (ctx.state === 'suspended') await ctx.resume()
}

export function setMasterVolume(v: number) {
  if (!master) return
  master.gain.value = clamp(v, 0, 1)
}

export function startMusic() {
  if (!ctx || !musicGain) return
  stopSynthMusic()

  // Chiptune-ish looping pattern inspired by classic Tetris vibe.
  // Not the original copyrighted recording; a synth homage.
  const tempo = 150
  const beat = 60 / tempo

  const now = ctx.currentTime + 0.05

  const melody = [
    'E5', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4', 'A4',
    'C5', 'E5', 'D5', 'C5', 'B4', 'B4', 'C5', 'D5',
    'E5', 'C5', 'A4', 'A4', 'D5', 'F5', 'A5', 'G5',
    'F5', 'E5', 'C5', 'E5', 'D5', 'C5', 'B4', 'B4',
  ]

  const bass = [
    'E3', 'E3', 'E3', 'E3', 'A2', 'A2', 'A2', 'A2',
    'D3', 'D3', 'D3', 'D3', 'G2', 'G2', 'G2', 'G2',
  ]

  const chord = ['E4', 'G4', 'B4']

  const mel = voice('square', 0.18)
  const bas = voice('triangle', 0.12)
  const pad = chordVoices('sine', 0.06, chord.length)

  musicOscs = [mel.osc, bas.osc, ...pad.oscs]

  scheduleSequence(now, beat / 2, melody, (t, f) => {
    mel.env.gain.setValueAtTime(0.0001, t)
    mel.env.gain.exponentialRampToValueAtTime(0.18, t + 0.01)
    mel.env.gain.exponentialRampToValueAtTime(0.0001, t + beat / 2 - 0.01)
    mel.osc.frequency.setValueAtTime(f, t)
  })

  scheduleSequence(now, beat, bass, (t, f) => {
    bas.env.gain.setValueAtTime(0.0001, t)
    bas.env.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
    bas.env.gain.exponentialRampToValueAtTime(0.0001, t + beat - 0.02)
    bas.osc.frequency.setValueAtTime(f, t)
  })

  // slow pad chord
  chord.forEach((n, i) => {
    const f = noteToHz(n)
    const o = pad.oscs[i]!
    o.frequency.setValueAtTime(f, now)
  })
  pad.env.gain.setValueAtTime(0.0001, now)
  pad.env.gain.exponentialRampToValueAtTime(0.05, now + 0.2)

  // loop rescheduler
  const loopLen = (melody.length * (beat / 2))
  musicTimer = window.setInterval(() => {
    if (!ctx) return
    const t0 = ctx.currentTime + 0.05
    scheduleSequence(t0, beat / 2, melody, (t, f) => {
      mel.env.gain.setValueAtTime(0.0001, t)
      mel.env.gain.exponentialRampToValueAtTime(0.18, t + 0.01)
      mel.env.gain.exponentialRampToValueAtTime(0.0001, t + beat / 2 - 0.01)
      mel.osc.frequency.setValueAtTime(f, t)
    })
    scheduleSequence(t0, beat, bass, (t, f) => {
      bas.env.gain.setValueAtTime(0.0001, t)
      bas.env.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
      bas.env.gain.exponentialRampToValueAtTime(0.0001, t + beat - 0.02)
      bas.osc.frequency.setValueAtTime(f, t)
    })
  }, loopLen * 1000)
}

export function stopSynthMusic() {
  if (musicTimer) {
    clearInterval(musicTimer)
    musicTimer = 0
  }
  musicOscs.forEach((o) => {
    try {
      o.stop()
    } catch {}
    try {
      o.disconnect()
    } catch {}
  })
  musicOscs = []
}

export function sfx(name: SfxName) {
  if (!ctx || !master) return

  const t = ctx.currentTime

  const out = ctx.createGain()
  out.gain.value = 0.18
  out.connect(master)

  const o = ctx.createOscillator()
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 1800
  o.connect(f)
  f.connect(out)

  const g = ctx.createGain()
  g.gain.value = 0.0001
  f.connect(g)
  g.connect(out)

  switch (name) {
    case 'rotate':
      o.type = 'square'
      o.frequency.setValueAtTime(540, t)
      o.frequency.exponentialRampToValueAtTime(880, t + 0.03)
      break
    case 'drop':
      o.type = 'triangle'
      o.frequency.setValueAtTime(220, t)
      o.frequency.exponentialRampToValueAtTime(90, t + 0.07)
      break
    case 'clear':
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(660, t)
      o.frequency.exponentialRampToValueAtTime(990, t + 0.08)
      break
    case 'tetris':
      o.type = 'square'
      o.frequency.setValueAtTime(880, t)
      o.frequency.exponentialRampToValueAtTime(1320, t + 0.12)
      break
    case 'hold':
      o.type = 'sine'
      o.frequency.setValueAtTime(420, t)
      o.frequency.exponentialRampToValueAtTime(300, t + 0.08)
      break
    case 'gameover':
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(330, t)
      o.frequency.exponentialRampToValueAtTime(55, t + 0.5)
      f.frequency.setValueAtTime(1200, t)
      f.frequency.exponentialRampToValueAtTime(200, t + 0.5)
      break
  }

  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.28, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + (name === 'gameover' ? 0.55 : 0.12))

  o.start(t)
  o.stop(t + (name === 'gameover' ? 0.6 : 0.14))
}

function voice(type: OscillatorType, level: number) {
  if (!ctx || !musicGain) throw new Error('audio not booted')

  const osc = ctx.createOscillator()
  osc.type = type
  const env = ctx.createGain()
  env.gain.value = 0.0001

  osc.connect(env)
  env.connect(musicGain)

  osc.start()

  return { osc, env, level, oscs: [osc] as OscillatorNode[] }
}

function chordVoices(type: OscillatorType, level: number, count: number) {
  if (!ctx || !musicGain) throw new Error('audio not booted')
  const env = ctx.createGain()
  env.gain.value = 0.0001
  env.connect(musicGain)

  const oscs: OscillatorNode[] = []
  for (let i = 0; i < count; i++) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.connect(env)
    osc.start()
    oscs.push(osc)
  }

  return { oscs, env, level }
}

function scheduleSequence(t0: number, step: number, notes: string[], fn: (t: number, f: number) => void) {
  for (let i = 0; i < notes.length; i++) {
    fn(t0 + i * step, noteToHz(notes[i]!))
  }
}

function noteToHz(n: string) {
  const m = /^([A-G])(#?)(\d)$/.exec(n)
  if (!m) return 440
  const letter = m[1]!
  const sharp = m[2] === '#'
  const oct = Number(m[3]!)

  const semis: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const a4 = 440

  let note = semis[letter] + (sharp ? 1 : 0)
  const midi = (oct + 1) * 12 + note
  const a4midi = 69
  return a4 * Math.pow(2, (midi - a4midi) / 12)
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
