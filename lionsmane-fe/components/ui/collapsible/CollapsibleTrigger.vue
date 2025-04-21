<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { CollapsibleTrigger, type CollapsibleTriggerProps } from 'reka-ui'

const props = defineProps<CollapsibleTriggerProps>()
</script>

<template>
  <CollapsibleTrigger
    data-slot="collapsible-trigger"
    v-bind="props"
  >
    <slot />
  </CollapsibleTrigger>
</template>
