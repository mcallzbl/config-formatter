<script lang="ts" setup></script>

<template>
  <router-view />
</template>

<style>
/* 全局样式重置，移除默认的白色背景 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow-x: hidden;
}

</style>
