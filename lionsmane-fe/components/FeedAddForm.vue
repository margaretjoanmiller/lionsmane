<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { postFeedsBody } from "@/utils/gen/feed-resource";
import type { SchemaFeedDto } from "~/utils/gen/schema";

const { $toast } = useNuxtApp();

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(postFeedsBody),
});

const { loggedIn, user, login } = useOidcAuth();

const feedStore = useFeedStore();

if (!loggedIn.value) {
  await login();
}

const onSubmit = handleSubmit(async (values) => {
  try {
    await $lion("/feeds", {
      method: "POST",
      body: values,
      headers: {
        Authorization: `Bearer ${user?.value?.accessToken}`,
      },

      async onResponse() {
        await feedStore.fetchFeeds();
        $toast.success("Successfully added feed");
      },
      async onResponseError({ error }) {
        console.error(error);
        $toast.error(`Error adding feed`);
      },
    });

    return navigateTo({ name: "dashboard-home" });
  } catch (e) {
    $toast.error("Unknown error adding feed");
    console.error(e);
    throw createError({
      status: 500,
      statusMessage: `Error adding feed ${e}`,
    });
  }
});
</script>

<template>
  <form @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="title">
      <FormItem>
        <FormLabel>Feed title</FormLabel>
        <FormControl>
          <Input type="text" placeholder="epic news" v-bind="componentField" />
        </FormControl>
        <FormDescription> This is the name for this feed</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="url">
      <FormItem>
        <FormLabel>Feed url</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="https://epic-news.com/feed.xml"
            rules="required"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription> This is the url for this feed</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Feed description</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="https://epic-news.com/feed.xml"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription> This is the url for this feed</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit"> Submit</Button>
  </form>
</template>
