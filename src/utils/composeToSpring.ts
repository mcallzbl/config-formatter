export type SpringOutput = 'spring-yaml' | 'spring-properties' | 'spring-env'

export interface MysqlConfig {
  host: string
  port: number
  database: string | null
  username: string | null
  password: string | null
  timezone: string | null
}

export interface RedisConfig {
  host: string
  port: number
  password: string | null
}

export interface SpringServiceConfig {
  mysql: MysqlConfig | null
  redis: RedisConfig | null
}

function parseEnvList(lines: string[], startIndex: number): Record<string, string> {
  const env: Record<string, string> = {}
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('-')) break
    const m = line.replace(/^-\s*/, '')
    const eqIndex = m.indexOf('=')
    if (eqIndex === -1) continue
    const key = m.slice(0, eqIndex).trim()
    const rawVal = m.slice(eqIndex + 1).trim()
    env[key] = rawVal.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
  }
  return env
}

function parsePortsList(
  lines: string[],
  startIndex: number,
): Array<{ host: number; container: number }> {
  const ports: Array<{ host: number; container: number }> = []
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('-')) break
    const token = line.replace(/^-\s*/, '').replace(/"/g, '')
    const [hostStr, containerStr] = token.split(':')
    const host = parseInt(hostStr, 10)
    const container = parseInt(containerStr, 10)
    if (Number.isFinite(host) && Number.isFinite(container)) {
      ports.push({ host, container })
    }
  }
  return ports
}

export function parseComposeToServiceConfig(text: string): SpringServiceConfig {
  const lines = text.split(/\r?\n/)
  let mysql: MysqlConfig | null = null
  let redis: RedisConfig | null = null

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (/image:\s*mysql/i.test(t)) {
      // parse forward for mysql
      let env: Record<string, string> = {}
      let hostPort: number | null = null
      let tz: string | null = null
      for (let j = i + 1; j < lines.length; j++) {
        const tj = lines[j].trim()
        if (/^image:/i.test(tj)) break
        if (/^environment:/i.test(tj)) {
          const parsed = parseEnvList(lines, j + 1)
          env = { ...env, ...parsed }
          tz = env['TZ'] ?? tz
        }
        if (/^ports:/i.test(tj)) {
          const ports = parsePortsList(lines, j + 1)
          const m = ports.find((p) => p.container === 3306) || ports[0]
          if (m) hostPort = m.host
        }
      }
      mysql = {
        host: 'localhost',
        port: hostPort ?? 3306,
        database: env['MYSQL_DATABASE'] ?? null,
        username: env['MYSQL_USER'] ?? 'root',
        password: env['MYSQL_PASSWORD'] ?? env['MYSQL_ROOT_PASSWORD'] ?? null,
        timezone: tz ?? null,
      }
    }

    if (/image:\s*redis/i.test(t)) {
      // parse forward for redis
      let hostPort: number | null = null
      for (let j = i + 1; j < lines.length; j++) {
        const tj = lines[j].trim()
        if (/^image:/i.test(tj)) break
        if (/^ports:/i.test(tj)) {
          const ports = parsePortsList(lines, j + 1)
          const m = ports.find((p) => p.container === 6379) || ports[0]
          if (m) hostPort = m.host
        }
      }
      redis = {
        host: 'localhost',
        port: hostPort ?? 6379,
        password: null,
      }
    }
  }

  return { mysql, redis }
}

function buildJdbcUrl(cfg: MysqlConfig): string {
  const base = `jdbc:mysql://${cfg.host}:${cfg.port}/${cfg.database ?? ''}`
  const params: string[] = []
  if (cfg.timezone) params.push(`serverTimezone=${encodeURIComponent(cfg.timezone)}`)
  params.push('useSSL=false')
  return params.length ? `${base}?${params.join('&')}` : base
}

export function toSpringYaml(config: SpringServiceConfig): string {
  const lines: string[] = []
  lines.push('spring:')
  if (config.mysql) {
    lines.push('  datasource:')
    lines.push('    driver-class-name: com.mysql.cj.jdbc.Driver')
    lines.push(`    url: ${buildJdbcUrl(config.mysql)}`)
    if (config.mysql.username) lines.push(`    username: ${config.mysql.username}`)
    if (config.mysql.password) lines.push(`    password: ${config.mysql.password}`)
  }
  if (config.redis) {
    lines.push('  data:')
    lines.push('    redis:')
    lines.push(`      host: ${config.redis.host}`)
    lines.push(`      port: ${config.redis.port}`)
    if (config.redis.password) lines.push(`      password: ${config.redis.password}`)
  }
  return lines.join('\n')
}

export function toSpringProperties(config: SpringServiceConfig): string {
  const lines: string[] = []
  if (config.mysql) {
    lines.push('spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver')
    lines.push(`spring.datasource.url=${buildJdbcUrl(config.mysql)}`)
    if (config.mysql.username) lines.push(`spring.datasource.username=${config.mysql.username}`)
    if (config.mysql.password) lines.push(`spring.datasource.password=${config.mysql.password}`)
  }
  if (config.redis) {
    lines.push(`spring.data.redis.host=${config.redis.host}`)
    lines.push(`spring.data.redis.port=${config.redis.port}`)
    if (config.redis.password) lines.push(`spring.data.redis.password=${config.redis.password}`)
  }
  return lines.join('\n')
}

export function toSpringEnv(config: SpringServiceConfig): string {
  const lines: string[] = []
  if (config.mysql) {
    lines.push('SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver')
    lines.push(`SPRING_DATASOURCE_URL=${buildJdbcUrl(config.mysql)}`)
    if (config.mysql.username) lines.push(`SPRING_DATASOURCE_USERNAME=${config.mysql.username}`)
    if (config.mysql.password) lines.push(`SPRING_DATASOURCE_PASSWORD=${config.mysql.password}`)
  }
  if (config.redis) {
    lines.push(`SPRING_DATA_REDIS_HOST=${config.redis.host}`)
    lines.push(`SPRING_DATA_REDIS_PORT=${config.redis.port}`)
    if (config.redis.password) lines.push(`SPRING_DATA_REDIS_PASSWORD=${config.redis.password}`)
  }
  return lines.join('\n')
}

export function composeToSpring(text: string, out: SpringOutput): string {
  const config = parseComposeToServiceConfig(text)
  switch (out) {
    case 'spring-yaml':
      return toSpringYaml(config)
    case 'spring-properties':
      return toSpringProperties(config)
    case 'spring-env':
      return toSpringEnv(config)
  }
}
