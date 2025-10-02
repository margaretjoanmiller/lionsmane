export type Feed = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  authors: string[] | null;
  categories: string[] | null;
  copyright: string | null;
  image: string | null;
  updated: string | null;
};

export interface FeedTreeData {
  id: string;
  name: string;
  unreadCount: number | null;
  favicon: string | null;
  folderId: string | null;
  type: 'feed' | 'folder';
  children?: Array<FeedTreeData>;
}
