<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { loggedIn, openInPopup } = useUserSession();

async function login() {
  openInPopup('/auth/keycloak');

  if (loggedIn) {

    await navigateTo('/dashboard');
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl"> Welcome back</CardTitle>
        <CardDescription> Login with your keycloak account</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-6">
          <div class="flex flex-col gap-4">
            <UButton variant="outline" class="w-full" @click="login">
              <Icon name="simple-icons:keycloak" />
              Login with Keycloak
            </UButton>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
