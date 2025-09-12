export interface NewArticle {
  title: string;
  url: string | null;
  authors: { name: string; email: string }[];
  categories: string[];
  description: string | null;
  rawContent: string | null;
  readableHtml: string | null;
  readableText: string | null;
  keywords: string[];
  image: string | null;
  imageAlt: string | null;
  media: string[];
  published: string;
  updated: string | null;
  feedId: string;
}

export interface Article extends NewArticle {
  id: string;
  fullArticleText: string | null;
  fullArticleHtml: string | null;
  isRead?: boolean;
  isStarred?: boolean;
}
