<!--
  - Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from 'reka-ui'

const props = defineProps<CollapsibleContentProps>()
</script>

<template>
  <CollapsibleContent
    data-slot="collapsible-content"
    v-bind="props"
  >
    <slot />
  </CollapsibleContent>
</template>
