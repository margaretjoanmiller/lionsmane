import { NewArticle } from './dto/new-article.dto';

export interface Article extends NewArticle {
  id: string;
  fullArticleText: string | null;
  fullArticleHtml: string | null;
  isRead?: boolean;
  isStarred?: boolean;
}
