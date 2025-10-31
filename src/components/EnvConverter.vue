<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EnvFormat } from '@/utils/envConvert'
import { convert } from '@/utils/envConvert'
import { composeToSpring, type SpringOutput } from '@/utils/composeToSpring'

type Side = 'left' | 'right'

type LeftFormat = EnvFormat | 'compose'
type RightFormat = EnvFormat | SpringOutput

const leftFormat = ref<LeftFormat>('idea')
const rightFormat = ref<RightFormat>('dotenv')
const leftText = ref('')
const rightText = ref('')

const canLeftToRight = computed(() => leftText.value.trim().length > 0)
const canRightToLeft = computed(() => rightText.value.trim().length > 0)

function handleSwapFormats() {
  const lf = leftFormat.value
  leftFormat.value = rightFormat.value
  rightFormat.value = lf
}

function doConvert(direction: Side) {
  if (direction === 'left') {
    if (!canRightToLeft.value) return
    if (leftFormat.value === 'compose') return
    if (rightFormat.value === 'spring-env' || rightFormat.value === 'spring-properties' || rightFormat.value === 'spring-yaml') return
    leftText.value = convert(rightText.value, rightFormat.value as EnvFormat, leftFormat.value as EnvFormat)
  } else {
    if (!canLeftToRight.value) return
    if (leftFormat.value === 'compose') {
      const out = rightFormat.value
      if (out === 'spring-env' || out === 'spring-properties' || out === 'spring-yaml') {
        rightText.value = composeToSpring(leftText.value, out)
        return
      }
      // compose 仅单向到 spring；禁止其它目标
      rightText.value = ''
      return
    }
    if (rightFormat.value === 'spring-env' || rightFormat.value === 'spring-properties' || rightFormat.value === 'spring-yaml') {
      // 非 compose 左侧，暂不支持直接到 spring；保持与需求一致
      rightText.value = ''
      return
    }
    rightText.value = convert(leftText.value, leftFormat.value as EnvFormat, rightFormat.value as EnvFormat)
  }
}

function clearBoth() {
  leftText.value = ''
  rightText.value = ''
}
</script>

<template>
  <div class="converter">
    <h1 class="title">配置文件转换器</h1>
    <div class="panes" role="group" aria-label="env converter">
      <section class="pane">
        <label class="label" for="left-format">来源格式</label>
        <select id="left-format" v-model="leftFormat">
          <option value="idea">IntelliJ IDEA</option>
          <option value="dotenv">.env</option>
          <option value="linux">Linux Shell</option>
          <option value="compose">Docker Compose（只支持到 Spring）</option>
        </select>
        <textarea
          v-model="leftText"
          class="editor"
          placeholder="在此粘贴环境变量，例如：\nFOO=bar\nBAZ=qux"
          aria-label="left editor"
        />
      </section>

      <div class="actions">
        <button class="btn" :disabled="!canLeftToRight" @click="doConvert('right')">→ 转换</button>
        <button class="btn" :disabled="!canRightToLeft" @click="doConvert('left')">← 转换</button>
        <button class="btn secondary" @click="handleSwapFormats">交换格式</button>
        <button class="btn tertiary" @click="clearBoth">清空</button>
      </div>

      <section class="pane">
        <label class="label" for="right-format">目标格式</label>
        <select id="right-format" v-model="rightFormat">
          <option value="idea">IntelliJ IDEA</option>
          <option value="dotenv">.env</option>
          <option value="linux">Linux Shell</option>
          <option value="spring-yaml">Spring Boot YAML</option>
          <option value="spring-properties">Spring Boot properties</option>
          <option value="spring-env">Spring Boot 环境变量</option>
        </select>
        <textarea
          v-model="rightText"
          class="editor"
          placeholder="转换结果将在此显示"
          aria-label="right editor"
        />
      </section>
    </div>
  </div>
  
</template>

<style scoped>
.converter { 
  display: flex; 
  flex-direction: column; 
  gap: 16px; 
  padding: 16px; 
}

.title { 
  margin: 0; 
  font-size: 20px; 
}

.panes { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 12px; 
}

@media (orientation: landscape) {
  .panes {
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
  }
}

.pane { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}

.label { 
  font-weight: 600; 
}

select { 
  padding: 6px 8px; 
}

.editor { 
  width: 100%; 
  min-height: 200px; 
  resize: vertical; 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; 
}

.actions { 
  display: flex; 
  flex-direction: row; 
  gap: 8px; 
  align-items: center; 
  justify-content: center; 
}

@media (orientation: portrait) {
  .actions {
    justify-content: start;
  }
}

.btn { 
  padding: 6px 10px; 
  border: 1px solid #ccc; 
  border-radius: 6px; 
  background: #fff; 
  cursor: pointer; 
}

.btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}

.btn.secondary { 
  background: #f4f4f5; 
}

.btn.tertiary { 
  background: #f9fafb; 
}
</style>


