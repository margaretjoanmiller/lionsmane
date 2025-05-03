<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->

<script setup lang="ts">
import { useMutation } from "@pinia/colada";
import { h, resolveComponent } from "vue";
import * as z from "zod";
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import type { SchemaFeedDto, SchemaFolderOut } from "@/utils/gen/schema";
import { postFeedsUpdateIdBody } from "@/utils/gen/feed-resource";

definePageMeta({
  layout: "dash",
});

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();

const { user } = useOidcAuth();

const feedStore = useFeedStore();
const folderStore = useFolderStore();

await folderStore.fetchFolders();

type FolderSelect = {
  label: string;
  id: string;
};

const folders = computed(() => folderStore.getFoldersAsSelect());

const data = computed(() => feedStore.feeds);

const state = ref<UpdateSchema>({});
const currentFeed = ref<UpdateSchema>({
  title: null,
  description: null,
  url: null,
  folderId: "",
});

const {
  mutate: deleteFeed,
  status: deleteStatus,
  asyncStatus: deleteAsyncStatus,
} = useMutation({
  mutation: (id: string) => {
    return $lion(`/feeds/delete/{id}`, {
      path: {
        id,
      },
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
  },
});

const {
  mutate: editFeed,
  status: editStatus,
  asyncStatus: editAsyncStatus,
} = useMutation({
  mutation: (feed: SchemaFeedDto) => {
    return $lion(`/feeds/update/{id}`, {
      method: "POST",
      path: {
        id: feed.id!,
      },
      body: {
        ...feed,
      },
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
  },
});

const columns: TableColumn<SchemaFeedDto>[] = [
  {
    accessorKey: "id",
    header: "#",
  },
  {
    accessorKey: "title",
    header: "title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "url",
    header: "URL",
  },
  {
    accessorKey: "lastUpdated",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("lastUpdated")).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    },
  },
  {
    accessorKey: "feedId",
    header: "Feed",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            }),
        ),
      );
    },
  },
];

function getRowItems(row: Row<SchemaFeedDto>) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Edit",
      onSelect() {
        currentFeed.value = row.original;
        state.value.title = currentFeed.value.title;
        state.value.description = currentFeed.value.description;
        state.value.url = currentFeed.value.url;
        state.value.folderId = currentFeed.value.folderId;
        isModalOpen.value = true;
      },
    },
    {
      label: "Delete",
      onSelect() {
        deleteFeed(row.getValue("id"));
      },
    },
  ];
}

function onSubmit() {
  editFeed(state as UpdateSchema);
  if (editStatus.value === "error") {
    toast.add({
      title: "Error updating feed",
      color: "error",
    });
  }
  if (editStatus.value === "success") {
    toast.add({ title: "Feed updated successfully", color: "success" });
  }
}

type UpdateSchema = z.output<typeof postFeedsUpdateIdBody>;

const isModalOpen = ref(false);
</script>

<template>
  <div class="flex justify-center">
    <UTable :data="data" :columns="columns" class="flex-1" />
    <UModal v-model:open="isModalOpen">
      <UButton hidden="hidden">Open</UButton>
      <template #content>
        <UForm
          :schema="postFeedsUpdateIdBody"
          :state="state"
          @submit="onSubmit"
        >
          <UFormField label="title" name="title">
            <UInput v-model="state.title" />
          </UFormField>

          <UFormField label="description" name="description">
            <UInput v-model="state.description" />
          </UFormField>

          <UFormField label="url" name="url">
            <UInput v-model="state.url" type="url" />
          </UFormField>

          <FormField label="folderId" name="folderId">
            <USelect
              v-model="state.folderId!"
              label="Folders"
              value-key="id"
              :items="folders"
              class="w-48"
            />
          </FormField>

          <UButton type="submit"> Submit</UButton>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
