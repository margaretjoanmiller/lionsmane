import { Link, useRouteContext } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ArticleDetail } from '@/types/article';
import { $api } from '@/lib/fetch-client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';
import { Button } from './ui/button';

function ReadBadge({ read }: { read: boolean }) {
  if (read) {
    return <Badge variant="secondary">Read</Badge>;
  } else {
    return <Badge variant="default">Unread</Badge>;
  }
}

export function ArticleCard({ article }: { article: ArticleDetail }) {
  const { mutate, error } = $api.useMutation('patch', '/article/status/{id}');

  if (error) {
    toast.error('Error marking article as read');
  }

  const articleFeed =
    article.feedTitle.length > 50
      ? article.feedTitle.slice(0, 50) + '...'
      : article.feedTitle;

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
          <div className="justify">
            <ReadBadge read={article.isRead || false} />
            <Badge variant="outline">{articleFeed}</Badge>
            {article.isStarred && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  mutate({
                    params: {
                      path: {
                        id: article.id,
                      },
                      query: {
                        status: 'unstarred',
                      },
                    },
                    credentials: 'include',
                  })
                }
              >
                <SolarStarBold />
              </Button>
            )}
            {!article.isStarred && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  mutate({
                    params: {
                      path: {
                        id: article.id,
                      },
                      query: {
                        status: 'starred',
                      },
                    },
                    credentials: 'include',
                  })
                }
              >
                <SolarStarLinear />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>{article.readableText?.slice(0, 150) + '...'}</CardContent>
    </Card>
  );
}
