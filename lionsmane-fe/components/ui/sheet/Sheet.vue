<!--
  - Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { DialogRoot, type DialogRootEmits, type DialogRootProps, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot
    data-slot="sheet"
    v-bind="forwarded"
  >
    <slot />
  </DialogRoot>
</template>
