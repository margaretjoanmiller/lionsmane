<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
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
import { toast } from "vue-sonner";

import { postFeedsBody } from "@/utils/gen/feed-resource";

const form = useForm({ validationSchema: toTypedSchema(postFeedsBody) });

const { loggedIn, user, login } = useOidcAuth();

const feedStore = useFeedStore();

if (!loggedIn.value) {
  await login();
}

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await $lion("/feeds", {
      method: "POST",
      body: values,
      headers: {
        Authorization: `Bearer ${user?.value?.accessToken}`,
      },
      async onResponse({ response }) {
        console.log(response);
        if (!response.ok) {
          toast.error("Error adding feed");
          console.log(await response.json());
        } else {
          toast.success("Feed added");
          await feedStore.fetchFeeds();
          await navigateTo("/dashboard");
        }
      },
    });
  } catch (e) {
    console.log(`Error adding feed: ${e}`);
    toast.error("Unknown error adding feed");
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
