import { Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import type { ArticleDetail } from '@/types/article';
import { $api } from '@/lib/fetch-client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

function ReadBadge({ read }: { read: boolean }) {
  if (read) {
    return <Badge variant="secondary">Read</Badge>;
  } else {
    return <Badge variant="default">Unread</Badge>;
  }
}

export function ArticleCard({ article }: { article: ArticleDetail }) {
  const [dismissBlur, setDismissBlur] = React.useState(false);

  const { mutate, error } = $api.useMutation('patch', '/article/status/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['get', '/article/unread'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['get', '/article/read'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['get', '/article/starred'],
      });
    },
  });
  const queryClient = useQueryClient();

  if (error) {
    toast.error('Error marking article as read');
  }

  const articleFeed =
    article.feedTitle.length > 50
      ? article.feedTitle.slice(0, 50) + '...'
      : article.feedTitle;

  function markStarred() {
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
    });
  }
  function markUnstarred() {
    mutate({
      params: {
        path: {
          id: article.id,
        },
        query: {
          status: 'unstarred',
        },
      },
    });
  }

  const card = (
    <>
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
            {!article.isStarred && (
              <Button variant="ghost" size="icon" onClick={markStarred}>
                <SolarStarLinear />
              </Button>
            )}
            {article.isStarred && (
              <Button variant="ghost" size="icon" onClick={markUnstarred}>
                <SolarStarBold />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {format(new Date(article.published), 'MMM d, yyyy HH:mm')}
        </CardDescription>
      </CardHeader>
      <CardContent>{article.readableText?.slice(0, 150) + '...'}</CardContent>
    </>
  );

  if (article.isBlurred && !dismissBlur) {
    return (
      <Card>
        {article.contentWarning.map((cw) => (
          <Badge variant="outline" className="mask-center">
            {cw}
          </Badge>
        ))}
        <div className="blur-sm">{card}</div>
        <Button variant="ghost" onClick={() => setDismissBlur(true)}>
          Dismiss blur
        </Button>
      </Card>
    );
  } else if (article.isBlurred && dismissBlur) {
    return (
      <Card>
        {card}
        <Button variant="ghost" onClick={() => setDismissBlur(false)}>
          Reapply Blur
        </Button>
      </Card>
    );
  } else {
    return <Card>{card}</Card>;
  }
}
