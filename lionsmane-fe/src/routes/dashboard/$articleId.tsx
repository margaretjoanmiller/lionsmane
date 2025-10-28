import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authClient } from '@/lib/auth-client';
import { $api } from '@/lib/fetch-client';
import { usePrefStore } from '@/stores/userPref.store';
import FlowbiteMapPinAltOutline from '~icons/flowbite/map-pin-alt-outline';
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
          </h1>
          <h2 className="text-center scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
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
                    onClick={() => {
                      if (data.url)
                        readLater({
                          body: {
                            url: data.url,
                          },
                          credentials: 'include',
                        });
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <SolarBookBookmarkLineDuotone />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to readeck</TooltipContent>
              </Tooltip>
            )}
          </h2>
          <h3 className="text-center scroll-m-20 text-2xl font-semibold tracking-tight pb-1">
            {data.authors?.map((author) => author.name).join(', ')}
            <Badge className="ml-2" variant="outline">
              {articleFeed}
            </Badge>
          </h3>
          <h4 className="text-center scroll-m-20 font-medium tracking-tight py-1 flex flex-col">
            <time dateTime={data.published}>
              {format(new Date(data.published), 'MMM d, yyyy HH:mm')}
            </time>
            {data.geo && data.geo.point && (
              <Badge>
                <FlowbiteMapPinAltOutline />
                {data.geo.point.lat}, {data.geo.point.lng}
              </Badge>
            )}
          </h4>
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
        </div>
        <div className="flex flex-col items-center">
          {data.youtube ? (
            <ReactPlayer
              controls
              src={data.url!}
              style={{ aspectRatio: '16/9', height: 'auto', width: '100%' }}
            />
          ) : (
            []
          )}
          {data.podcast && (
            <Item variant="outline">
              <ItemHeader>Podcast episode info</ItemHeader>
              {data.podcast.images && data.podcast.images.srcset && (
                <ItemMedia>
                  <img
                    aria-label="Podcast episode image did not provide alt text"
                    src={data.podcast.images.srcset}
                  ></img>
                </ItemMedia>
              )}
              <ItemContent>
                {data.podcast.episode && (
                  <ItemTitle>
                    {data.podcast.episode?.number} -
                    {data.podcast.episode?.display}
                  </ItemTitle>
                )}
                <ItemDescription>
                  <ul>
                    {data.podcast.persons?.map((p) => (
                      <li>
                        <a href={p.href}>{p.display}</a>
                      </li>
                    ))}
                  </ul>
                </ItemDescription>
              </ItemContent>
              {data.podcast.license && (
                <ItemFooter>
                  {data.podcast.license.url ? (
                    <a href={data.podcast.license.url}>
                      {data.podcast.license.display}
                    </a>
                  ) : (
                    <small>{data.podcast.license.display}</small>
                  )}
                </ItemFooter>
              )}
            </Item>
          )}
          {data.itunes && (
            <Item variant="outline">
              <ItemHeader>Podcast episode info</ItemHeader>
              {data.itunes.image && (
                <ItemMedia>
                  <img
                    aria-label="Podcast episode image did not provide alt text"
                    className="object-cover"
                    height={80}
                    src={data.itunes.image}
                    width={80}
                  ></img>
                </ItemMedia>
              )}
              <ItemContent>
                <ItemTitle>
                  {data.itunes.episode} - {data.itunes.title}{' '}
                  {data.itunes.explicit && (
                    <Badge variant="outline">Explicit</Badge>
                  )}
                </ItemTitle>
                <ItemDescription>
                  {data.itunes.duration && (
                    <p>
                      Duration: about {Math.round(data.itunes.duration / 60)}{' '}
                      minutes
                    </p>
                  )}
                </ItemDescription>
              </ItemContent>
            </Item>
          )}

          {data.enclosures?.map((e) => {
            if (e.mime_type && e.mime_type !== 'application/octet-stream')
              return (
                <ReactPlayer controls>
                  <source src={e.url} type={e.mime_type} />
                </ReactPlayer>
              );
            return (
              <img
                aria-label="enclosure image did not include alt text"
                src={e.url}
              />
            );
          })}

          {data.media?.contents?.map((m) => {
            if (m.type && m.type !== 'application/octet-stream')
              return (
                <ReactPlayer controls>
                  <source src={m.url} type={m.type} />
                </ReactPlayer>
              );
            return (
              <img
                aria-label="enclosure image did not include alt text"
                src={m.url}
              />
            );
          })}
        </div>
        <footer className="flex flex-col items-center pt-8">
          <a
            className="font-bold hover:underline text-(--primary)"
            href={data.url!}
          >
            Original article
          </a>
          <div className="grid-flow-row">
            {data.categories?.map((c) => (
              <Badge className="m-1" variant="outline">
                {c.term}
              </Badge>
            ))}
          </div>
        </footer>
      </div>
    </article>
  );
}
