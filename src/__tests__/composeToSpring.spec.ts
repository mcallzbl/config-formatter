import { describe, expect, it } from 'vitest'
import {
  parseComposeToServiceConfig,
  toSpringEnv,
  toSpringProperties,
  toSpringYaml,
} from '@/utils/composeToSpring'

const composeSnippet = `
    user-mysql:
      image: mysql:latest
      container_name: user-mysql
      volumes:
        - ./data/mysql/mysql_user_data:/var/lib/mysql
        - ./etc/sql/init.sql:/docker-entrypoint-initdb.d/startup.sql
      ports:
        - "33306:3306"
      environment:
        - TZ=Asia/Shanghai
        - MYSQL_ROOT_PASSWORD=J7*jJ9$2mKpL*5n
        - MYSQL_USER=yukino
        - MYSQL_DATABASE=user
        - MYSQL_PASSWORD=J7*jJ9$2mKpL*5n
      restart: unless-stopped

    user-redis:
      image: redis:7.2-alpine
      container_name: user-redis
      ports:
        - "6379:6379"
      environment:
        - TZ=Asia/Shanghai
      volumes:
        - redis_data:/data
        - ./etc/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
      command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
`

describe('composeToSpring', () => {
  it('parses compose and generates YAML', () => {
    const cfg = parseComposeToServiceConfig(composeSnippet)
    expect(cfg.mysql?.port).toBe(33306)
    expect(cfg.redis?.port).toBe(6379)

    const y = toSpringYaml(cfg)
    expect(y).toContain('spring:')
    expect(y).toContain('datasource:')
    expect(y).toContain('data:')
    expect(y).toContain('redis:')
  })

  it('generates properties and env', () => {
    const cfg = parseComposeToServiceConfig(composeSnippet)
    const p = toSpringProperties(cfg)
    expect(p).toContain('spring.datasource.url=jdbc:mysql://localhost:33306/user')
    const e = toSpringEnv(cfg)
    expect(e).toContain('SPRING_DATASOURCE_URL=jdbc:mysql://localhost:33306/user')
  })
})
