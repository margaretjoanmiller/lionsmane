import { create } from 'zustand';

export enum ArticleFilter {
  Unread,
  Starred,
  Read,
  All,
}

interface FilterState {
  filter: ArticleFilter;
  setToUnread: () => void;
  setToRead: () => void;
  setToStarred: () => void;
  setToAll(): void;
}

export const useArticleFilterStore = create<FilterState>((set) => ({
  filter: ArticleFilter.Unread,
  setToAll: () => set(() => ({ filter: ArticleFilter.All })),
  setToRead: () => set(() => ({ filter: ArticleFilter.Read })),
  setToStarred: () => set(() => ({ filter: ArticleFilter.Starred })),
  setToUnread: () => set(() => ({ filter: ArticleFilter.Unread })),
}));
