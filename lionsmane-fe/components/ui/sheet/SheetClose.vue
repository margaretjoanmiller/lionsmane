<!--
  - Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { DialogClose, type DialogCloseProps } from 'reka-ui'

const props = defineProps<DialogCloseProps>()
</script>

<template>
  <DialogClose
    data-slot="sheet-close"
    v-bind="props"
  >
    <slot />
  </DialogClose>
</template>
