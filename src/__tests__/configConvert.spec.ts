import { describe, expect, it } from 'vitest'
import {
  type ConfigProperty,
  convertConfig,
  generateProperties,
  generateYaml,
  parseProperties,
  parseYaml,
} from '@/utils/configConvert'

describe('parseProperties', () => {
  it('should parse simple key=value pairs', () => {
    const input = 'server.port=8080\nspring.datasource.url=jdbc:mysql://localhost:3306/mydb'
    const result = parseProperties(input)

    expect(result).toEqual([
      { key: 'server.port', value: '8080' },
      { key: 'spring.datasource.url', value: 'jdbc:mysql://localhost:3306/mydb' },
    ])
  })

  it('should handle escape sequences', () => {
    const input = 'message=Hello\\nWorld\\t!'
    const result = parseProperties(input)

    expect(result).toEqual([{ key: 'message', value: 'Hello\nWorld\t!' }])
  })

  it('should handle backslash escaping', () => {
    const input = 'path=C:\\\\Program Files\\\\App'
    const result = parseProperties(input)

    expect(result).toEqual([{ key: 'path', value: 'C:\\Program Files\\App' }])
  })

  it('should ignore comments and empty lines', () => {
    const input = '# This is a comment\n! Another comment\n\nkey=value'
    const result = parseProperties(input)

    expect(result).toEqual([{ key: 'key', value: 'value' }])
  })

  it('should handle multiline values', () => {
    const input = 'long.value=This is a very long value that \\ncontinues on the next line'
    const result = parseProperties(input)

    expect(result).toEqual([
      { key: 'long.value', value: 'This is a very long value that \ncontinues on the next line' },
    ])
  })
})

describe('parseYaml', () => {
  it('should parse simple YAML key-value pairs', () => {
    const input = 'server:\n  port: 8080\n  host: localhost'
    const result = parseYaml(input)

    expect(result).toEqual([
      { key: 'server.port', value: '8080' },
      { key: 'server.host', value: 'localhost' },
    ])
  })

  it('should handle quoted values', () => {
    const input = 'message: "Hello, World!"\nsingle: \'Single quoted\''
    const result = parseYaml(input)

    expect(result).toEqual([
      { key: 'message', value: 'Hello, World!' },
      { key: 'single', value: 'Single quoted' },
    ])
  })

  it('should handle nested structures', () => {
    const input = `spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: secret
  redis:
    host: localhost
    port: 6379`

    const result = parseYaml(input)

    expect(result).toEqual([
      { key: 'spring.datasource.url', value: 'jdbc:mysql://localhost:3306/mydb' },
      { key: 'spring.datasource.username', value: 'root' },
      { key: 'spring.datasource.password', value: 'secret' },
      { key: 'spring.redis.host', value: 'localhost' },
      { key: 'spring.redis.port', value: '6379' },
    ])
  })

  it('should ignore comments and empty lines', () => {
    const input = '# Configuration\nserver:\n  port: 8080\n\n# Database\ndb:\n  name: mydb'
    const result = parseYaml(input)

    expect(result).toEqual([
      { key: 'server.port', value: '8080' },
      { key: 'db.name', value: 'mydb' },
    ])
  })
})

describe('generateProperties', () => {
  it('should generate properties from ConfigProperty array', () => {
    const properties: ConfigProperty[] = [
      { key: 'server.port', value: '8080' },
      { key: 'spring.datasource.url', value: 'jdbc:mysql://localhost:3306/mydb' },
    ]

    const result = generateProperties(properties)
    expect(result).toBe('server.port=8080\nspring.datasource.url=jdbc:mysql://localhost:3306/mydb')
  })

  it('should escape special characters in values', () => {
    const properties: ConfigProperty[] = [
      { key: 'message', value: 'Hello\nWorld\t!' },
      { key: 'path', value: 'C:\\Program Files\\App' },
    ]

    const result = generateProperties(properties)
    expect(result).toBe('message=Hello\\nWorld\\t!\npath=C:\\\\Program Files\\\\App')
  })
})

describe('generateYaml', () => {
  it('should generate YAML from ConfigProperty array', () => {
    const properties: ConfigProperty[] = [
      { key: 'server.port', value: '8080' },
      { key: 'server.host', value: 'localhost' },
      { key: 'spring.datasource.url', value: 'jdbc:mysql://localhost:3306/mydb' },
    ]

    const result = generateYaml(properties)
    const expected = `server:
  port: 8080
  host: localhost
spring:
  datasource:
    url: "jdbc:mysql://localhost:3306/mydb"`

    expect(result).toBe(expected)
  })

  it('should handle special characters with quotes', () => {
    const properties: ConfigProperty[] = [
      { key: 'message', value: 'Hello, World!' },
      { key: 'special', value: 'value:with@special#chars' },
    ]

    const result = generateYaml(properties)
    expect(result).toContain('message: "Hello, World!"')
    expect(result).toContain('special: "value:with@special#chars"')
  })

  it('should handle single level properties', () => {
    const properties: ConfigProperty[] = [
      { key: 'port', value: '8080' },
      { key: 'host', value: 'localhost' },
    ]

    const result = generateYaml(properties)
    expect(result).toBe('port: 8080\nhost: localhost')
  })
})

describe('convertConfig', () => {
  it('should convert properties to yaml', () => {
    const input = `server.port=8080
server.host=localhost
spring.datasource.url=jdbc:mysql://localhost:3306/mydb`

    const result = convertConfig(input, 'properties', 'yaml')

    expect(result).toContain('server:')
    expect(result).toContain('  port: 8080')
    expect(result).toContain('  host: localhost')
    expect(result).toContain('spring:')
    expect(result).toContain('  datasource:')
    expect(result).toContain('    url: "jdbc:mysql://localhost:3306/mydb"')
  })

  it('should convert yaml to properties', () => {
    const input = `server:
  port: 8080
  host: localhost
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb`

    const result = convertConfig(input, 'yaml', 'properties')

    expect(result).toContain('server.port=8080')
    expect(result).toContain('server.host=localhost')
    expect(result).toContain('spring.datasource.url=jdbc:mysql://localhost:3306/mydb')
  })

  it('should handle complex nested structures', () => {
    const yamlInput = `app:
  name: MyApplication
  version: 1.0.0
  database:
    primary:
      host: localhost
      port: 5432
      name: mydb
    cache:
      type: redis
      ttl: 3600`

    const result = convertConfig(yamlInput, 'yaml', 'properties')

    expect(result).toContain('app.name=MyApplication')
    expect(result).toContain('app.version=1.0.0')
    expect(result).toContain('app.database.primary.host=localhost')
    expect(result).toContain('app.database.primary.port=5432')
    expect(result).toContain('app.database.primary.name=mydb')
    expect(result).toContain('app.database.cache.type=redis')
    expect(result).toContain('app.database.cache.ttl=3600')
  })

  it('should handle properties with special characters when converting to yaml', () => {
    const input = `app.name=My Application
app.description=An app with "quotes" and #special chars
app.path=C:\\Program Files\\App`

    const result = convertConfig(input, 'properties', 'yaml')

    expect(result).toContain('app:')
    expect(result).toContain('  name: My Application')
    expect(result).toContain('  description: "An app with \\"quotes\\" and #special chars"')
    // Just check that path exists and is properly quoted
    expect(result).toMatch(/path:\s*"[^"]*Program Files[^"]*"/)
  })
})
