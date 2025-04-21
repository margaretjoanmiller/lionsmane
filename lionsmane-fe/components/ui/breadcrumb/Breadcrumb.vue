<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <nav
    aria-label="breadcrumb"
    data-slot="breadcrumb"
    :class="props.class"
  >
    <slot />
  </nav>
</template>
