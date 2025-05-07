<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

function login() {
  if (!loggedIn.value) openInPopup('/auth/keycloak');

  if (loggedIn.value) return navigateTo('/dashboard');
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
            <Button variant="outline" class="w-full" @click="login">
              <Icon name="simple-icons:keycloak" />
              Login with Keycloak
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    <div
      class="text-center text-xs text-balance text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary"
    >
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </div>
  </div>
</template>
