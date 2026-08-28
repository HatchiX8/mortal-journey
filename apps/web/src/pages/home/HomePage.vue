<template>
  <main class="mx-auto flex min-h-screen w-full max-w-3xl items-center p-6">
    <headerComp />
    <NCard title="凡人・遨遊天地" class="w-full">
      <p class="mb-6 text-slate-600">前端基礎環境已就緒。</p>
      <NButton type="primary">開始旅程</NButton>
    </NCard>
  </main>
</template>

<script setup lang="ts">
import { headerComp } from '@/layouts/index'
import { NButton, NCard } from 'naive-ui'
</script>
