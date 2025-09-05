import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ArticleDetail } from '@/types/article';

export function ArticleCard({ article }: { article: ArticleDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
      </CardHeader>
      <CardContent>{article.readableText?.slice(0, 150) + '...'}</CardContent>
    </Card>
  );
}
