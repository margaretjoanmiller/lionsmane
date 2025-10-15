import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import ReactPlayer from 'react-player';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authClient } from '@/lib/auth-client';
import { $api } from '@/lib/fetch-client';
import { usePrefStore } from '@/stores/userPref.store';
import SolarBookBookmarkLineDuotone from '~icons/solar/book-bookmark-line-duotone';
import SolarGlassesLineDuotone from '~icons/solar/glasses-line-duotone';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';

export const Route = createFileRoute('/dashboard/$articleId')({
  component: ArticlePage,
});

function ArticlePage() {
  const { data: session } = authClient.useSession();
  const hasReadeckKey = usePrefStore((state) => state.hasReadeckKey);
  const setReadeckkey = usePrefStore((state) => state.setToTrue);
  const unsetReadeckkey = usePrefStore((state) => state.setToFalse);
  if (session?.user.hasReadeckKey === true) {
    setReadeckkey();
  } else {
    unsetReadeckkey();
  }

  const articleId = Route.useParams().articleId;
  const queryClient = useQueryClient();
  const { data } = $api.useSuspenseQuery('get', '/article/{id}', {
    credentials: 'include',
    params: {
      path: {
        id: articleId,
      },
    },
  });

  const { mutate } = $api.useMutation('patch', '/article/status/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['get', '/article/{id}'],
      });
    },
  });

  const { mutate: requestFullArticleText } = $api.useMutation(
    'post',
    '/article/readable/{id}',
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['get', '/article/{id}'],
        });
      },
    },
  );

  const { mutate: readLater } = $api.useMutation('post', '/readlater', {
    onError(error) {
      // @ts-expect-error: Error in openapi-typescript error typing
      toast.error('Error saving to readeck', { description: error.message });
    },
    onSuccess: () => {
      toast.success('Saved to readeck');
    },
  });

  function markUnread() {
    mutate({
      credentials: 'include',
      params: { path: { id: data.id }, query: { status: 'unread' } },
    });
  }

  function markRead() {
    mutate({
      credentials: 'include',
      params: { path: { id: data.id }, query: { status: 'read' } },
    });
  }

  const articleFeed =
    data.feedTitle && data.feedTitle.length > 20
      ? data.feedTitle.slice(0, 20) + '...'
      : data.feedTitle;

  return (
    <article className="bg-card flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <div className="m-6">
        <header>
          <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
            {data.title}
            {data.isRead ? (
              <Button
                asChild
                className="ml-2"
                onClick={markUnread}
                size="sm"
                variant="ghost"
              >
                <Badge variant="outline">Read</Badge>
              </Button>
            ) : (
              <Button asChild className="ml-2" onClick={markRead} size="sm">
                <Badge>Unread</Badge>
              </Button>
            )}
            {data.isStarred && (
              <Button
                onClick={() =>
                  mutate({
                    credentials: 'include',
                    params: {
                      path: {
                        id: data.id,
                      },
                      query: {
                        status: 'unstarred',
                      },
                    },
                  })
                }
                size="icon"
                variant="ghost"
              >
                <SolarStarBold />
              </Button>
            )}
            {!data.isStarred && (
              <Button
                onClick={() =>
                  mutate({
                    credentials: 'include',
                    params: {
                      path: {
                        id: data.id,
                      },
                      query: {
                        status: 'starred',
                      },
                    },
                  })
                }
                size="icon"
                variant="ghost"
              >
                <SolarStarLinear />
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={() =>
                    requestFullArticleText({
                      credentials: 'include',
                      params: { path: { id: data.id } },
                    })
                  }
                  size="icon"
                  variant="ghost"
                >
                  <SolarGlassesLineDuotone />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Request full article text</TooltipContent>
            </Tooltip>
            {hasReadeckKey && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    onClick={() =>
                      readLater({
                        body: {
                          url: data.url,
                        },
                        credentials: 'include',
                      })
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <SolarBookBookmarkLineDuotone />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to readeck</TooltipContent>
              </Tooltip>
            )}
          </h1>
          <h2 className="text-center font-bold">
            {data.authors?.map((author) => author.name).join(', ')}
            <Badge className="ml-2" variant="outline">
              {articleFeed}
            </Badge>
          </h2>
        </header>
        <div className="prose prose-lg prose-pink">
          {
            <div
              dangerouslySetInnerHTML={{
                __html:
                  data.fullArticleHtml ||
                  data.readableHtml ||
                  data.description ||
                  '<p>error loading</p>',
              }} // we clean this on the backend
            />
          }
          <div>
            {data.enclosures?.map((e) => (
              <ReactPlayer controls>
                <source src={e.url} type={e.type} />
              </ReactPlayer>
            ))}
          </div>
          <footer className="flex-col">
            <a href={data.url!}>Original article</a>
            <div className="grid-flow-row">
              {data.categories?.map((c) => (
                <Badge className="m-1" variant="outline">
                  {c.term}
                </Badge>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}
