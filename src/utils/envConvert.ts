export type EnvFormat = 'idea' | 'dotenv' | 'linux'

export interface EnvPair {
  key: string
  value: string
}

function trimQuotes(raw: string): string {
  const s = raw.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const inner = s.slice(1, -1)
    return s.startsWith('"') ? inner.replace(/\\"/g, '"') : inner.replace(/\\'/g, "'")
  }
  return s
}

function needsQuoting(value: string): boolean {
  return /\s|#|;|"|'/.test(value)
}

function serializeValueForDotenv(value: string): string {
  if (value === '') return '""'
  if (needsQuoting(value)) {
    return '"' + value.replace(/"/g, '\\"') + '"'
  }
  return value
}

function serializeValueForShell(value: string): string {
  // Prefer double quotes; escape internal
  return '"' + value.replace(/"/g, '\\"') + '"'
}

function splitToTokens(text: string, allowSpaceSeparated: boolean): string[] {
  // Split on newlines and semicolons. Also support space-separated KEY=VALUE tokens on a single line.
  const lines = text
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter(Boolean)
  const tokens: string[] = []
  for (const line of lines) {
    if (allowSpaceSeparated && line.includes('=') && line.includes(' ')) {
      // try to split by spaces but keep quoted segments
      const parts: string[] = []
      let current = ''
      let inSingle = false
      let inDouble = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"' && !inSingle) inDouble = !inDouble
        if (ch === "'" && !inDouble) inSingle = !inSingle
        if (ch === ' ' && !inSingle && !inDouble) {
          if (current.trim()) parts.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
      if (current.trim()) parts.push(current.trim())
      for (const p of parts) tokens.push(p)
    } else {
      tokens.push(line)
    }
  }
  return tokens
}

export function parseToPairs(text: string, format: EnvFormat): EnvPair[] {
  const tokens = splitToTokens(text, format === 'linux')
  const pairs: EnvPair[] = []
  for (const token of tokens) {
    const cleaned = token.replace(/^export\s+/, '')
    const eqIndex = cleaned.indexOf('=')
    if (eqIndex === -1) continue
    const key = cleaned.slice(0, eqIndex).trim()
    let value = cleaned.slice(eqIndex + 1)
    if (!key) continue
    if (format === 'dotenv') {
      // Allow inline comments only if value is unquoted
      const trimmed = value.trim()
      if (!(trimmed.startsWith('"') || trimmed.startsWith("'"))) {
        const hashIndex = trimmed.indexOf('#')
        if (hashIndex !== -1) {
          value = trimmed.slice(0, hashIndex)
        }
      }
    }
    pairs.push({ key, value: trimQuotes(value) })
  }
  return pairs
}

export function generateFromPairs(pairs: EnvPair[], format: EnvFormat): string {
  switch (format) {
    case 'idea': {
      // IntelliJ IDEA 环境变量文本区域通常接受按行的 KEY=VALUE
      return pairs.map((p) => `${p.key}=${p.value}`).join('\n')
    }
    case 'dotenv': {
      return pairs.map((p) => `${p.key}=${serializeValueForDotenv(p.value)}`).join('\n')
    }
    case 'linux': {
      return pairs.map((p) => `export ${p.key}=${serializeValueForShell(p.value)}`).join('\n')
    }
  }
}

export function convert(text: string, from: EnvFormat, to: EnvFormat): string {
  const pairs = parseToPairs(text, from)
  return generateFromPairs(pairs, to)
}
