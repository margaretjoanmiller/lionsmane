import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import React from 'react';
import { toast } from 'sonner';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';

import type { ArticleDetail } from '#/zod/article.zod.ts';
import { Badge } from '@/components/ui/badge';
import { $api } from '@/lib/api';

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

function ReadBadge({ read }: { read: boolean }) {
  if (read) {
    return <Badge variant="secondary">Read</Badge>;
  } else {
    return <Badge variant="default">Unread</Badge>;
  }
}

export function ArticleCard({ article }: { article: ArticleDetail }) {
  const [dismissBlur, setDismissBlur] = React.useState(false);

  const queryClient = useQueryClient();

  const { mutate, error } = $api.useMutation('patch', '/article/{id}', {
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

  if (error) {
    toast.error('Error marking article as read', { description: error.message });
  }

  const articleFeed =
    article.feedTitle && article.feedTitle.length > 20
      ? article.feedTitle.slice(0, 20) + '...'
      : article.feedTitle;

  function markStarred() {
    mutate({
      params: {
        path: {
          id: article.id,
        },
      },
      body: {
        isStarred: true,
        isRead: article.isRead || false,
      },
    });
  }
  function markUnstarred() {
    mutate({
      params: {
        path: {
          id: article.id,
        },
      },
      body: {
        isStarred: false,
        isRead: article.isRead || false,
      },
    });
  }

  const card = (
    <>
      <CardHeader>
        <CardTitle>
          <Link
            onClick={() =>
              mutate({
                params: {
                  path: {
                    id: article.id,
                  },
                },
                body: {
                  isStarred: article.isStarred || false,
                  isRead: true,
                },
              })
            }
            params={{ articleId: article.id }}
            to="/dash/$articleId"
          >
            {article.title || 'No title'}
          </Link>
          <div className="justify">
            <div className="flex items-center">
              <ReadBadge read={article.isRead || false} />
              <Badge className="ml-1" variant="outline">
                {articleFeed}
              </Badge>
              {!article.isStarred && (
                <Button onClick={markStarred} size="icon" variant="ghost">
                  <SolarStarLinear />
                </Button>
              )}
              {article.isStarred && (
                <Button onClick={markUnstarred} size="icon" variant="ghost">
                  <SolarStarBold />
                </Button>
              )}
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          <time dateTime={article.published}>
            {format(new Date(article.published), 'MMM d, yyyy HH:mm')}
          </time>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {article.image ? (
          <>
            <div className="aspect-video overflow-hidden rounded-md">
              <img
                alt={article.imageAlt || article.title}
                className="h-full w-full object-cover"
                src={article.image}
              />
            </div>
            <div className="text-muted-foreground mt-1 line-clamp-3 text-sm">
              {article.readableText}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground line-clamp-5 text-sm">{article.readableText}</div>
        )}
      </CardContent>
    </>
  );

  if (article.isBlurred && !dismissBlur) {
    return (
      <Card className="group relative flex h-full flex-col shadow-2xl">
        <div className="blur-sm">{card}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-wrap justify-center gap-2">
            {article.contentWarning?.map((cw, index) => (
              <Badge key={index} variant="outline">
                {cw}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 transform"
          onClick={() => setDismissBlur(true)}
          variant="ghost"
        >
          Dismiss blur
        </Button>
      </Card>
    );
  } else if (article.isBlurred && dismissBlur) {
    return (
      <Card className="group relative flex h-full flex-col shadow-2xl">
        {card}
        <Button
          className="-my-3 max-w-1/3 place-self-center"
          onClick={() => setDismissBlur(false)}
          variant="ghost"
        >
          Reapply Blur
        </Button>
      </Card>
    );
  } else {
    return <Card className="group relative flex h-full flex-col shadow-2xl">{card}</Card>;
  }
}
