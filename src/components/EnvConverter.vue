<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { EnvFormat } from '@/utils/envConvert'
import { convert, generateFromPairs, parseToPairs } from '@/utils/envConvert'
import { composeToSpring } from '@/utils/composeToSpring'
import {
  type ConfigFormat,
  convertConfig,
  generateProperties,
  generateYaml,
  parseProperties,
  parseYaml,
} from '@/utils/configConvert'
import { type LeftFormat, type RightFormat, usePreferencesStore } from '@/stores/preferences'

type Side = 'left' | 'right'

// 使用Pinia store
const preferencesStore = usePreferencesStore()
const { leftFormat, rightFormat, leftText, rightText } = storeToRefs(preferencesStore)
const { canLeftToRight, canRightToLeft } = storeToRefs(preferencesStore)

// 组件本地状态
const isConverting = ref(false)
const conversionStatus = ref<string>('')

// 根据左侧格式获取可用的右侧格式选项
const availableRightFormats = computed(() => {
  const left = leftFormat.value

  if (left === 'compose') {
    // Docker Compose 只能转换为 Spring Boot 格式
    return [
      { value: 'spring-yaml', label: 'Spring Boot YAML' },
      { value: 'spring-properties', label: 'Spring Boot properties' },
      { value: 'spring-env', label: 'Spring Boot 环境变量' },
    ]
  } else if (left === 'properties' || left === 'yaml') {
    // Properties/YAML 只能互相转换
    return [
      { value: 'properties', label: 'Java Properties' },
      { value: 'yaml', label: 'YAML' },
    ]
  } else {
    // 环境变量格式可以转换为 properties/yaml 或其他环境变量格式
    return [
      { value: 'idea', label: 'IntelliJ IDEA' },
      { value: 'dotenv', label: '.env' },
      { value: 'linux', label: 'Linux Shell' },
      { value: 'properties', label: 'Java Properties' },
      { value: 'yaml', label: 'YAML' },
    ]
  }
})

// 根据右侧格式获取可用的左侧格式选项
const availableLeftFormats = computed(() => {
  const right = rightFormat.value

  if (right === 'spring-yaml' || right === 'spring-properties' || right === 'spring-env') {
    // Spring Boot 格式只能从 Docker Compose 转换过来
    return [{ value: 'compose', label: 'Docker Compose' }]
  } else if (right === 'properties' || right === 'yaml') {
    // Properties/YAML 只能互相转换，或者从环境变量格式转换过来
    return [
      { value: 'idea', label: 'IntelliJ IDEA' },
      { value: 'dotenv', label: '.env' },
      { value: 'linux', label: 'Linux Shell' },
      { value: 'properties', label: 'Java Properties' },
      { value: 'yaml', label: 'YAML' },
    ]
  } else {
    // 环境变量格式可以从其他环境变量格式或 properties/yaml 转换过来，也可以从 compose 转换（虽然代码中不支持）
    return [
      { value: 'idea', label: 'IntelliJ IDEA' },
      { value: 'dotenv', label: '.env' },
      { value: 'linux', label: 'Linux Shell' },
      { value: 'properties', label: 'Java Properties' },
      { value: 'yaml', label: 'YAML' },
      { value: 'compose', label: 'Docker Compose' },
    ]
  }
})

// 当左侧格式改变时，如果当前右侧格式不在可用列表中，自动选择第一个可用格式
watch(leftFormat, (newLeftFormat) => {
  const currentRightFormat = rightFormat.value
  const availableFormats = availableRightFormats.value.map((f) => f.value)

  if (!availableFormats.includes(currentRightFormat)) {
    // 自动选择第一个可用的右侧格式
    rightFormat.value = availableFormats[0] as RightFormat
  }
})

// 当右侧格式改变时，检查左侧格式是否兼容
watch(rightFormat, (newRightFormat) => {
  const currentLeftFormat = leftFormat.value
  const availableFormats = availableLeftFormats.value.map((f) => f.value)

  if (!availableFormats.includes(currentLeftFormat)) {
    // 自动选择第一个可用的左侧格式
    leftFormat.value = availableFormats[0] as LeftFormat
  }
})

function handleSwapFormats() {
  preferencesStore.swapFormats()
}

async function doConvert(direction: Side) {
  isConverting.value = true
  conversionStatus.value = '转换中...'

  // 模拟一些延迟以显示加载状态
  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    if (direction === 'left') {
      if (!canRightToLeft.value) return
      if (leftFormat.value === 'compose') return
      if (
        rightFormat.value === 'spring-env' ||
        rightFormat.value === 'spring-properties' ||
        rightFormat.value === 'spring-yaml'
      )
        return

      // Handle properties/yaml conversion
      if (
        (rightFormat.value === 'properties' || rightFormat.value === 'yaml') &&
        (leftFormat.value === 'properties' || leftFormat.value === 'yaml')
      ) {
        leftText.value = convertConfig(
          rightText.value,
          rightFormat.value as ConfigFormat,
          leftFormat.value as ConfigFormat,
        )
        conversionStatus.value = '转换完成！'
        setTimeout(() => (conversionStatus.value = ''), 2000)
        return
      }

      // Handle env format conversions (including between env and properties/yaml)
      if (rightFormat.value === 'properties' || rightFormat.value === 'yaml') {
        // Convert from properties/yaml to env format
        const properties =
          rightFormat.value === 'properties'
            ? parseProperties(rightText.value)
            : parseYaml(rightText.value)
        leftText.value = generateFromPairs(
          properties.map((p) => ({ key: p.key, value: p.value })),
          leftFormat.value as EnvFormat,
        )
        conversionStatus.value = '转换完成！'
        setTimeout(() => (conversionStatus.value = ''), 2000)
        return
      }

      if (leftFormat.value === 'properties' || leftFormat.value === 'yaml') {
        // Convert from env format to properties/yaml
        const pairs = parseToPairs(rightText.value, rightFormat.value as EnvFormat)
        const properties = pairs.map((p) => ({ key: p.key, value: p.value }))
        leftText.value =
          leftFormat.value === 'properties'
            ? generateProperties(properties)
            : generateYaml(properties)
        conversionStatus.value = '转换完成！'
        setTimeout(() => (conversionStatus.value = ''), 2000)
        return
      }

      leftText.value = convert(
        rightText.value,
        rightFormat.value as EnvFormat,
        leftFormat.value as EnvFormat,
      )
      conversionStatus.value = '转换完成！'
      setTimeout(() => (conversionStatus.value = ''), 2000)
    } else {
      if (!canLeftToRight.value) return
      if (leftFormat.value === 'compose') {
        const out = rightFormat.value
        if (out === 'spring-env' || out === 'spring-properties' || out === 'spring-yaml') {
          rightText.value = composeToSpring(leftText.value, out)
          conversionStatus.value = '转换完成！'
          setTimeout(() => (conversionStatus.value = ''), 2000)
          return
        }
        // compose 仅单向到 spring；禁止其它目标
        rightText.value = ''
        return
      }
      if (
        rightFormat.value === 'spring-env' ||
        rightFormat.value === 'spring-properties' ||
        rightFormat.value === 'spring-yaml'
      ) {
        // 非 compose 左侧，暂不支持直接到 spring；保持与需求一致
        rightText.value = ''
        return
      }

      // Handle properties/yaml conversion
      if (
        (leftFormat.value === 'properties' || leftFormat.value === 'yaml') &&
        (rightFormat.value === 'properties' || rightFormat.value === 'yaml')
      ) {
        rightText.value = convertConfig(
          leftText.value,
          leftFormat.value as ConfigFormat,
          rightFormat.value as ConfigFormat,
        )
        conversionStatus.value = '转换完成！'
        setTimeout(() => (conversionStatus.value = ''), 2000)
        return
      }

      // Handle env format conversions (including between env and properties/yaml)
      if (leftFormat.value === 'properties' || leftFormat.value === 'yaml') {
        // Convert from properties/yaml to env format
        const properties =
          leftFormat.value === 'properties'
            ? parseProperties(leftText.value)
            : parseYaml(leftText.value)
        rightText.value = generateFromPairs(
          properties.map((p) => ({ key: p.key, value: p.value })),
          rightFormat.value as EnvFormat,
        )
        conversionStatus.value = '转换完成！'
        setTimeout(() => (conversionStatus.value = ''), 2000)
        return
      }

      if (rightFormat.value === 'properties' || rightFormat.value === 'yaml') {
        // Convert from env format to properties/yaml
        const pairs = parseToPairs(leftText.value, leftFormat.value as EnvFormat)
        const properties = pairs.map((p) => ({ key: p.key, value: p.value }))
        rightText.value =
          rightFormat.value === 'properties'
            ? generateProperties(properties)
            : generateYaml(properties)
        conversionStatus.value = '转换完成！'
        setTimeout(() => (conversionStatus.value = ''), 2000)
        return
      }

      rightText.value = convert(
        leftText.value,
        leftFormat.value as EnvFormat,
        rightFormat.value as EnvFormat,
      )
      conversionStatus.value = '转换完成！'
      setTimeout(() => (conversionStatus.value = ''), 2000)
    }
  } catch (error) {
    console.error('Conversion error:', error)
    conversionStatus.value = '转换错误: ' + (error as Error).message
    setTimeout(() => (conversionStatus.value = ''), 3000)
  } finally {
    isConverting.value = false
  }
}

function getPlaceholder(format: LeftFormat): string {
  switch (format) {
    case 'idea':
      return '在此粘贴环境变量，例如：\nFOO=bar\nBAZ=qux'
    case 'dotenv':
      return '在此粘贴.env文件内容，例如：\nFOO=bar\nBAZ="quoted value"'
    case 'linux':
      return '在此粘贴Shell环境变量，例如：\nexport FOO="bar"\nexport BAZ="qux"'
    case 'properties':
      return '在此粘贴Java Properties，例如：\nserver.port=8080\nspring.datasource.url=jdbc:mysql://localhost:3306/mydb'
    case 'yaml':
      return '在此粘贴YAML配置，例如：\nserver:\n  port: 8080\n  host: localhost'
    case 'compose':
      return '在此粘贴Docker Compose配置，例如：\nservices:\n  mysql:\n    image: mysql:8.0'
    default:
      return '在此粘贴配置内容'
  }
}

function clearBoth() {
  preferencesStore.clearAll()
}
</script>

<template>
  <div class="converter">
    <div class="header">
      <h1 class="title">配置文件转换器</h1>
      <div class="subtitle">支持多种配置格式间的双向转换</div>
    </div>

    <!-- 状态提示 -->
    <div
      v-if="conversionStatus"
      :class="{
        'status-success': conversionStatus.includes('完成'),
        'status-error': conversionStatus.includes('错误'),
        'status-loading': isConverting,
      }"
      class="status-message"
    >
      <div class="status-icon">
        <span v-if="isConverting" class="spinner"></span>
        <span v-else-if="conversionStatus.includes('完成')" class="success-icon">✓</span>
        <span v-else class="error-icon">✗</span>
      </div>
      {{ conversionStatus }}
    </div>

    <div aria-label="env converter" class="panes" role="group">
      <section :class="{ 'pane-active': leftText.trim() }" class="pane">
        <div class="pane-header">
          <label class="label" for="left-format">来源格式</label>
          <div class="format-selector">
            <select id="left-format" v-model="leftFormat" class="format-select">
              <option
                v-for="format in availableLeftFormats"
                :key="format.value"
                :value="format.value"
              >
                {{ format.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="editor-container">
          <textarea
            v-model="leftText"
            :placeholder="getPlaceholder(leftFormat)"
            aria-label="left editor"
            class="editor"
          />
          <div v-if="leftText.trim()" class="editor-info">
            {{ leftText.trim().split('\n').length }} 行 · {{ leftText.trim().length }} 字符
          </div>
        </div>
      </section>

      <div class="actions">
        <button
          :disabled="!canLeftToRight || isConverting"
          class="btn btn-primary"
          @click="doConvert('right')"
        >
          <span v-if="isConverting && canLeftToRight" class="btn-spinner"></span>
          转换 →
        </button>
        <button
          :disabled="!canRightToLeft || isConverting"
          class="btn btn-primary"
          @click="doConvert('left')"
        >
          <span v-if="isConverting && canRightToLeft" class="btn-spinner"></span>
          ← 转换
        </button>
        <button :disabled="isConverting" class="btn btn-secondary" @click="handleSwapFormats">
          ⇄ 交换
        </button>
        <button :disabled="isConverting" class="btn btn-tertiary" @click="clearBoth">✕ 清空</button>
      </div>

      <section :class="{ 'pane-active': rightText.trim() }" class="pane">
        <div class="pane-header">
          <label class="label" for="right-format">目标格式</label>
          <div class="format-selector">
            <select id="right-format" v-model="rightFormat" class="format-select">
              <option
                v-for="format in availableRightFormats"
                :key="format.value"
                :value="format.value"
              >
                {{ format.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="editor-container">
          <textarea
            v-model="rightText"
            aria-label="right editor"
            class="editor"
            placeholder="转换结果将在此显示"
          />
          <div v-if="rightText.trim()" class="editor-info">
            {{ rightText.trim().split('\n').length }} 行 · {{ rightText.trim().length }} 字符
          </div>
        </div>
      </section>
    </div>

    <div class="footer">
      <div class="tips">💡 小贴士：支持 properties ↔ YAML 转换，以及与各种环境变量格式的互转</div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Header */
.header {
  text-align: center;
  color: white;
}

.title {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  font-weight: 400;
}

/* Status Message */
.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

.status-loading {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Spinner Animation */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Panes Layout */
.panes {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  flex: 1;
}

@media (orientation: landscape) {
  .panes {
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
  }
}

/* Pane Styling */
.pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.pane:hover {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.pane-active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.format-selector {
  flex: 1;
  max-width: 250px;
}

.format-select {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
}

.format-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.format-select:hover {
  border-color: #d1d5db;
}

/* Editor Container */
.editor-container {
  position: relative;
  flex: 1;
}

.editor {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family:
    'Fira Code', 'Cascadia Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono',
    'Source Code Pro', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s ease;
  background: #fafafa;
}

.editor:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.editor::placeholder {
  color: #9ca3af;
}

.editor-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  pointer-events: none;
}

/* Actions */
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

@media (orientation: landscape) {
  .actions {
    flex-direction: row;
    padding: 0 20px;
  }
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  justify-content: center;
}

.btn:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover:before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 10px -2px rgba(59, 130, 246, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 10px -2px rgba(107, 114, 128, 0.4);
}

.btn-tertiary {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
  box-shadow: 0 4px 6px -1px rgba(156, 163, 175, 0.3);
}

.btn-tertiary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 10px -2px rgba(156, 163, 175, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Footer */
.footer {
  text-align: center;
  padding: 16px;
}

.tips {
  display: inline-block;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: #4b5563;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .converter {
    padding: 16px;
    gap: 16px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }

  .pane {
    padding: 16px;
  }

  .pane-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .format-selector {
    max-width: none;
  }

  .editor {
    min-height: 200px;
    font-size: 13px;
  }

  .actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }

  .btn {
    flex: 1;
    min-width: 100px;
    padding: 10px 16px;
    font-size: 13px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .converter {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }

  .title,
  .subtitle {
    color: white;
  }

  .pane {
    background: #1e293b;
    border-color: #334155;
  }

  .label {
    color: #e2e8f0;
  }

  .format-select,
  .editor {
    background: #0f172a;
    color: #e2e8f0;
    border-color: #334155;
  }

  .format-select:focus,
  .editor:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }

  .editor::placeholder {
    color: #64748b;
  }

  .tips {
    background: rgba(30, 41, 59, 0.9);
    color: #cbd5e1;
  }
}
</style>
