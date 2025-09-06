import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ArticleDetail } from '@/types/article';
import { Button } from './ui/button';
import { $api } from '@/lib/fetch-client';

export function ArticleCard({ article }: { article: ArticleDetail }) {
  const { mutate, error } = $api.useMutation('patch', '/article/status/{id}');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link
            to="/dashboard/$articleId"
            params={{ articleId: article.id }}
            onClick={() =>
              mutate({
                params: {
                  path: {
                    id: article.id,
                  },
                  query: {
                    status: 'read',
                  },
                },
                credentials: 'include',
              })
            }
          >
            {article.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>{article.readableText?.slice(0, 150) + '...'}</CardContent>
    </Card>
  );
}
