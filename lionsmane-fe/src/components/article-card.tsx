import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ArticleDetail } from '@/types/article';

export function ArticleCard({ article }: { article: ArticleDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link to="/dashboard/$articleId" params={{ articleId: article.id }}>
            {article.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>{article.readableText?.slice(0, 150) + '...'}</CardContent>
    </Card>
  );
}
