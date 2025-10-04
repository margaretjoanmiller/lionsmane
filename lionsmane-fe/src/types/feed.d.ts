export type Feed = {
  id: string;
  feed_url: string;
  site_url: string;
  title: string;
  description: string | null;
  authors: string[] | null;
  categories: string[] | null;
  copyright: string | null;
  image: string | null;
  updated: string | null;
  icon: {
    feed_id: number;
    icon_id: number;
  };
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
