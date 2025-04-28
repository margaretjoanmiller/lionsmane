import { defineStore } from "pinia";
import type { SchemaFeedDto } from "@/utils/gen/schema";

export const useFeedStore = defineStore("feeds", () => {
  const { user, loggedIn } = useOidcAuth();

  const feeds: Ref<SchemaFeedDto[]> = ref([] as SchemaFeedDto[]);

  async function fetchFeeds() {
    if (loggedIn && user) {
      console.log("trying to get feeds");
      try {
        const { data, error } = await useLionData("/feeds", {
          headers: {
            Authorization: `Bearer ${user.value?.accessToken}`,
          },
        });
        if (error.value) {
          console.error("error getting feeds" + error);
          return error;
        }
        feeds.value = data.value as SchemaFeedDto[];
      } catch (e) {
        console.error(e);
      }
    }
  }

  return { feeds, fetchFeeds };
});
