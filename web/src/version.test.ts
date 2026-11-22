import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// One version for the whole repo: the web app and the Python package are released together.
describe('version', () => {
  it('is the same in web/package.json and compute/pyproject.toml', () => {
    const web = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')).version
    const pyproject = readFileSync(resolve(process.cwd(), '../compute/pyproject.toml'), 'utf-8')
    const python = pyproject.match(/^version\s*=\s*"([^"]+)"/m)?.[1]
    expect(web).toBe(python)
    expect(__APP_VERSION__).toBe(web)
  })
})
