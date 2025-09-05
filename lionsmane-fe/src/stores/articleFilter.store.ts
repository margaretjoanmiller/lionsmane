import { create } from 'zustand';

export enum ArticleFilter {
  Unread,
  Starred,
  Read,
}

interface FilterState {
  filter: ArticleFilter;
  setToUnread: () => void;
  setToRead: () => void;
  setToStarred: () => void;
}

export const useArticleFilterStore = create<FilterState>((set) => ({
  filter: ArticleFilter.Unread,
  setToUnread: () => set(() => ({ filter: ArticleFilter.Unread })),
  setToRead: () => set(() => ({ filter: ArticleFilter.Read })),
  setToStarred: () => set(() => ({ filter: ArticleFilter.Starred })),
}));
