import { describe, expect, it } from 'vitest'
import { shortcutAction, type KeyContext } from './shortcuts'

const free: KeyContext = { inField: false, onButton: false }
const key = (k: string, shift = false, ctx = free) => shortcutAction({ key: k, shiftKey: shift }, ctx)

describe('shortcutAction', () => {
  it('steps by event, or by beat with Shift', () => {
    expect(key('ArrowRight')).toEqual({ type: 'step', n: 1 })
    expect(key('ArrowLeft')).toEqual({ type: 'step', n: -1 })
    expect(key('ArrowLeft', true)).toEqual({ type: 'beat', n: -1 })
  })

  it('plays, jumps to now, focuses the date, switches views and play steps, shows help', () => {
    expect(key(' ')).toEqual({ type: 'play' })
    expect(key('k')).toEqual({ type: 'play' })
    expect(key('n')).toEqual({ type: 'now' })
    expect(key('d')).toEqual({ type: 'date' })
    expect(key('3')).toEqual({ type: 'view', index: 2 })
    expect(key('[')).toEqual({ type: 'speed', dir: -1 })
    expect(key(']')).toEqual({ type: 'speed', dir: 1 })
    expect(key('?', true)).toEqual({ type: 'help' })
    expect(key('x')).toBeNull()
    expect(key('0')).toBeNull()
  })

  it('stays out of the way while typing', () => {
    const typing = { inField: true, onButton: false }
    expect(key('ArrowRight', false, typing)).toBeNull()
    expect(key('n', false, typing)).toBeNull()
  })

  it('leaves Space to a focused button, and Ctrl/Alt/Cmd combinations to the browser', () => {
    expect(key(' ', false, { inField: false, onButton: true })).toBeNull()
    expect(key('k', false, { inField: false, onButton: true })).toEqual({ type: 'play' })
    expect(shortcutAction({ key: 'n', shiftKey: false, metaKey: true }, free)).toBeNull()
  })
})
