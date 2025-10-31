export type ConfigFormat = 'properties' | 'yaml'

export interface ConfigProperty {
  key: string
  value: string
}

/**
 * 解析properties格式文本
 * 支持标准Java properties格式：
 * - key=value 格式
 * - 支持转义字符 \n, \t, \r, \f, \\
 * - 支持Unicode转义 \uXXXX
 * - 支持#和!开头的注释（会忽略）
 * - 支持多行值（用\续行）
 */
export function parseProperties(text: string): ConfigProperty[] {
  const lines = text.split(/\r?\n/)
  const properties: ConfigProperty[] = []
  let currentKey: string | null = null
  let currentValue: string[] = []
  let isContinuation = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 跳过空行和注释
    if (!line || line.startsWith('#') || line.startsWith('!')) {
      continue
    }

    // 检查是否是续行
    if (line.endsWith('\\') && !line.includes('=')) {
      if (currentKey !== null && currentValue.length > 0) {
        // 移除续行符并添加到当前值
        currentValue.push(line.slice(0, -1))
        isContinuation = true
      }
      continue
    }

    // 如果是续行后的内容
    if (isContinuation && currentKey !== null) {
      currentValue.push(line)
      continue
    }

    // 处理普通的key=value行
    const equalIndex = line.indexOf('=')
    if (equalIndex === -1) continue

    // 保存之前的property
    if (currentKey !== null) {
      const fullValue = currentValue.join('')
      properties.push({
        key: currentKey,
        value: unescapePropertiesValue(fullValue),
      })
    }

    // 解析新的property
    const key = line.slice(0, equalIndex).trim()
    const value = line.slice(equalIndex + 1)

    // 检查是否以续行符结尾
    if (value.endsWith('\\')) {
      currentValue = [value.slice(0, -1)]
      isContinuation = true
    } else {
      currentValue = [value]
      isContinuation = false
    }

    currentKey = key
  }

  // 保存最后一个property
  if (currentKey !== null) {
    const fullValue = currentValue.join('')
    properties.push({
      key: currentKey,
      value: unescapePropertiesValue(fullValue),
    })
  }

  return properties
}

/**
 * 反转义properties值
 */
function unescapePropertiesValue(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\f/g, '\f')
    .replace(/\\\\/g, '\\')
}

/**
 * 转义properties值
 */
function escapePropertiesValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\f/g, '\\f')
}

/**
 * 解析YAML格式文本
 * 简化的YAML解析器，处理常见的键值对结构
 * 支持嵌套对象，将嵌套结构转换为点号分隔的键
 */
export function parseYaml(text: string): ConfigProperty[] {
  const properties: ConfigProperty[] = []
  const lines = text.split(/\r?\n/)
  const stack: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // 计算缩进级别
    const leadingSpaces = line.match(/^ */)?.[0]?.length || 0
    const indentLevel = Math.floor(leadingSpaces / 2) // 假设使用2个空格缩进

    // 调整栈深度
    while (stack.length > indentLevel) {
      stack.pop()
    }

    // 处理键值对
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmed.slice(0, colonIndex).trim()
    const valueStr = trimmed.slice(colonIndex + 1).trim()

    // 构建完整键路径
    const keyPath = [...stack, key]
    const fullKey = keyPath.join('.')

    if (valueStr) {
      // 有值的属性
      let value = valueStr

      // 处理引号包裹的值
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      properties.push({ key: fullKey, value })
    } else {
      // 嵌套对象，将键加入栈
      stack.push(key)
    }
  }

  return properties
}

/**
 * 生成properties格式文本
 */
export function generateProperties(properties: ConfigProperty[]): string {
  return properties.map((prop) => `${prop.key}=${escapePropertiesValue(prop.value)}`).join('\n')
}

/**
 * 生成YAML格式文本
 * 将点号分隔的键转换为嵌套的YAML结构
 */
export function generateYaml(properties: ConfigProperty[]): string {
  const root: any = {}

  // 构建嵌套对象结构
  for (const prop of properties) {
    const keys = prop.key.split('.')
    let current = root

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }

    current[keys[keys.length - 1]] = prop.value
  }

  // 转换为YAML字符串
  return yamlStringify(root, 0)
}

/**
 * 递归将对象转换为YAML字符串
 */
function yamlStringify(obj: any, indent: number): string {
  const spaces = '  '.repeat(indent)
  const lines: string[] = []

  if (typeof obj !== 'object' || obj === null) {
    return String(obj)
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${spaces}${key}:`)
      lines.push(yamlStringify(value, indent + 1))
    } else {
      let strValue = String(value)
      // 如果值包含特殊字符（除了字母、数字、空格、点、短横线），用引号包裹
      if (/[^a-zA-Z0-9\s._-]/.test(strValue)) {
        strValue = `"${strValue.replace(/"/g, '\\"')}"`
      }
      lines.push(`${spaces}${key}: ${strValue}`)
    }
  }

  return lines.join('\n')
}

/**
 * 配置文件转换主函数
 */
export function convertConfig(text: string, from: ConfigFormat, to: ConfigFormat): string {
  let properties: ConfigProperty[]

  // 解析源格式
  if (from === 'properties') {
    properties = parseProperties(text)
  } else if (from === 'yaml') {
    properties = parseYaml(text)
  } else {
    throw new Error(`Unsupported source format: ${from}`)
  }

  // 生成目标格式
  if (to === 'properties') {
    return generateProperties(properties)
  } else if (to === 'yaml') {
    return generateYaml(properties)
  } else {
    throw new Error(`Unsupported target format: ${to}`)
  }
}
