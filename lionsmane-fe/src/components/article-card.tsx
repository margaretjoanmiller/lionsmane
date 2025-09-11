import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import React from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { $api } from '@/lib/fetch-client';
import type { ArticleDetail } from '@/types/article';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

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
    article.feedTitle && article.feedTitle.length > 50
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
      <Card className="relative">
        <div className="blur-sm">{card}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-wrap gap-2 justify-center">
            {article.contentWarning?.map((cw, index) => (
              <Badge key={index} variant="outline">
                {cw}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          variant="ghost"
          onClick={() => setDismissBlur(true)}
        >
          Dismiss blur
        </Button>
      </Card>
    );
  } else if (article.isBlurred && dismissBlur) {
    return (
      <Card className="relative">
        {card}
        <Button
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          variant="ghost"
          onClick={() => setDismissBlur(false)}
        >
          Reapply Blur
        </Button>
      </Card>
    );
  } else {
    return <Card>{card}</Card>;
  }
}
