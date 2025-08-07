import { defineStore } from 'pinia';

export enum readStatus {
  UNREAD,
  READ,
  STARRED,
}
export const useReadStatusStore = defineStore('readStatus', {
  state: () => ({ readStatus: readStatus.UNREAD }),
  actions: {
    read() {
      this.readStatus = readStatus.READ;
    },
    unread() {
      this.readStatus = readStatus.UNREAD;
    },
    starred() {
      this.readStatus = readStatus.STARRED;
    },
  },
});
