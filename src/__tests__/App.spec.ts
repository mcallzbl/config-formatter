import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '@/router'

describe('App', () => {
  it('mounts and shows title', async () => {
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.text()).toContain('配置文件转换器')
  })
})
