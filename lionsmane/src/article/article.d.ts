export interface NewArticle {
  title: string;
  url: string;
  authors: string[];
  categories: string[];
  description?: string;
  rawContent?: string;
  readableHtml?: string;
  readableText?: string;
  keywords: string[];
  image?: string;
  media: string[];
  published: string;
  updated?: string | null;
  feedId: string;
}
