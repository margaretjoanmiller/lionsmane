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
