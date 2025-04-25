<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
const { login } = useOidcAuth();

async function onLogin() {
  await login().then(async () => {
    await navigateTo('dashboard')
  }).catch(()=> alert("could not log in to keycloak"))
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
        <form>
          <div class="grid gap-6">
            <div class="flex flex-col gap-4">
              <Button variant="outline" class="w-full" @click="onLogin()">
                <Icon name="simple-icons:keycloak" />
                Login with Keycloak
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    <div
      class="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4"
    >
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </div>
  </div>
</template>
