export interface ArticleDetail {
  id: string;
  title: string;
  url: string | null;
  authors: { name: string; email: string | null }[];
  categories: string[];
  description: string | null;
  readableText: string | null;
  keywords: string[];
  image: string | null;
  imageAlt: string | null;
  media: string[];
  published: string;
  updated: string | null;
  feedId: string;
  feedTitle: string | null;
  isRead: boolean | null;
  isStarred: boolean | null;
  isBlurred: boolean | null;
  isHidden: boolean | null;
  contentWarning: string[] | null;
}

export interface ArticleHidden extends ArticleDetail {
  ruleId: string;
}
