import { describe, it, expect } from 'vitest'
import { convert, parseToPairs, generateFromPairs } from '@/utils/envConvert'

describe('envConvert', () => {
  it('idea -> dotenv with spaces quoted', () => {
    const input = 'FOO=hello world\nBAR=123'
    const output = convert(input, 'idea', 'dotenv')
    expect(output).toBe('FOO="hello world"\nBAR=123')
  })

  it('dotenv -> linux keeps quoting', () => {
    const input = 'FOO="hello world"\nBAR=123'
    const output = convert(input, 'dotenv', 'linux')
    expect(output).toBe('export FOO="hello world"\nexport BAR="123"')
  })

  it('linux -> idea strips export and quotes', () => {
    const input = 'export FOO="hello world"\nexport BAR=123'
    const output = convert(input, 'linux', 'idea')
    expect(output).toBe('FOO=hello world\nBAR=123')
  })

  it('parse and regenerate roundtrip for dotenv', () => {
    const input = 'A=1\nB=two words\nC="x y"\nD=\'q\'\nE="contains \"quote\""'
    const pairs = parseToPairs(input, 'dotenv')
    const regenerated = generateFromPairs(pairs, 'dotenv')
    expect(regenerated).toContain('A=1')
    expect(regenerated).toContain('B="two words"')
    expect(regenerated).toContain('C="x y"')
    // D is not quoted in output since single quotes are normalized to double quotes only when necessary
    expect(regenerated).toContain('D=q')
    expect(regenerated).toContain('E="contains \\"quote\\""')
  })
})


