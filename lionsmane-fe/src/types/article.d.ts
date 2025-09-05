export interface ArticleDetail {
  id: string;
  title: string;
  url: string;
  authors: string[];
  categories: string[];
  description: string | null;
  readableText: string | null;
  keywords: string[];
  image: string | null;
  media: string[];
  published: string;
  updated: string | null;
  feedId: string;
  isRead: boolean | null;
  isStarred: boolean | null;
}
