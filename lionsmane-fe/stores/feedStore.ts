import {defineStore} from 'pinia'
import type {SchemaFeedDto} from "@/utils/gen/schema";

export const useFeedStore = defineStore('feed', {
    state: () => ({
        feeds: [] as SchemaFeedDto[],
        selectedFeed: null as SchemaFeedDto | null,
    }),
    actions: {
        async fetchFeeds(loggedIn: boolean, accessToken: string) {
            if(loggedIn) {
                const {data: feeds, error} = await useLionData("/feeds", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (error) {
                    return error
                }
                this.feeds = feeds.value as SchemaFeedDto[];
            }
        }
    }
})