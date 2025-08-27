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
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { authClient } from '~/lib/auth-client';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Success',
    description: 'The form has been submitted.',
    color: 'success',
  });
  await authClient.signIn.email({
    email: event.data.email,
    password: event.data.password,
  });
}

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
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
            <UForm
              :schema="schema"
              :state="state"
              class="space-y-4"
              @submit="onSubmit"
            >
              <UFormField label="Email" name="email">
                <UInput v-model="state.email" />
              </UFormField>

              <UFormField label="Password" name="password">
                <UInput v-model="state.password" type="password" />
              </UFormField>

              <UButton type="submit"> Submit </UButton>
            </UForm>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
