import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { EnvFormat } from '@/utils/envConvert'
import type { SpringOutput } from '@/utils/composeToSpring'
import type { ConfigFormat } from '@/utils/configConvert'

export type LeftFormat = EnvFormat | 'compose' | ConfigFormat
export type RightFormat = EnvFormat | SpringOutput | ConfigFormat

export const usePreferencesStore = defineStore('preferences', () => {
  // 状态定义
  const leftFormat = ref<LeftFormat>('idea')
  const rightFormat = ref<RightFormat>('dotenv')
  const leftText = ref('')
  const rightText = ref('')

  // 从localStorage加载保存的格式设置
  const loadSavedFormats = () => {
    const savedLeftFormat = localStorage.getItem('converter-left-format') as LeftFormat
    const savedRightFormat = localStorage.getItem('converter-right-format') as RightFormat

    if (savedLeftFormat) leftFormat.value = savedLeftFormat
    if (savedRightFormat) rightFormat.value = savedRightFormat
  }

  // 设置左侧格式
  const setLeftFormat = (format: LeftFormat) => {
    leftFormat.value = format
    localStorage.setItem('converter-left-format', format)
  }

  // 设置右侧格式
  const setRightFormat = (format: RightFormat) => {
    rightFormat.value = format
    localStorage.setItem('converter-right-format', format)
  }

  // 设置文本内容
  const setLeftText = (text: string) => {
    leftText.value = text
  }

  const setRightText = (text: string) => {
    rightText.value = text
  }

  // 清空所有内容
  const clearAll = () => {
    leftText.value = ''
    rightText.value = ''
  }

  // 交换格式
  const swapFormats = () => {
    const tempLeft = leftFormat.value
    const tempRight = rightFormat.value

    // 类型转换，使用断言确保安全性
    leftFormat.value = tempRight as unknown as LeftFormat
    rightFormat.value = tempLeft as unknown as RightFormat

    // 保存交换后的格式到localStorage
    localStorage.setItem('converter-left-format', leftFormat.value)
    localStorage.setItem('converter-right-format', rightFormat.value)
  }

  // 计算属性
  const canLeftToRight = computed(() => leftText.value.trim().length > 0)
  const canRightToLeft = computed(() => rightText.value.trim().length > 0)

  // 初始化时加载保存的格式
  loadSavedFormats()

  return {
    // 状态
    leftFormat,
    rightFormat,
    leftText,
    rightText,

    // 计算属性
    canLeftToRight,
    canRightToLeft,

    // 方法
    setLeftFormat,
    setRightFormat,
    setLeftText,
    setRightText,
    clearAll,
    swapFormats,
  }
})
