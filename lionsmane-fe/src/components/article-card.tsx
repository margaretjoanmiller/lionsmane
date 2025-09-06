import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ArticleDetail } from '@/types/article';
import { $api } from '@/lib/fetch-client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>{article.readableText?.slice(0, 150) + '...'}</CardContent>
    </Card>
  );
}
