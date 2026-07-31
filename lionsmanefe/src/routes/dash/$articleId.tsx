import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';

import { $api } from '#/lib/api/index.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dash/$articleId')({
  component: ArticlePage,
});

function ArticlePage() {
  // const { data: session } = authClient.useSession();
  // const hasReadeckKey = usePrefStore((state) => state.hasReadeckKey);
  // const setReadeckkey = usePrefStore((state) => state.setToTrue);
  // const unsetReadeckkey = usePrefStore((state) => state.setToFalse);
  // if (session?.user.hasReadeckKey === true) {
  //   setReadeckkey();
  // } else {
  //   unsetReadeckkey();
  // }

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

  const { mutate } = $api.useMutation('patch', '/article/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['get', '/article/{id}'],
      });
    },
  });

  function markUnread() {
    mutate({
      credentials: 'include',
      params: {
        path: { id: data.id },
      },
      body: {
        isRead: false,
        isStarred: data.isStarred || false,
      },
    });
  }

  function markRead() {
    mutate({
      credentials: 'include',
      params: {
        path: { id: data.id },
      },
      body: {
        isRead: true,
        isStarred: data.isStarred || false,
      },
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
          <h2 className="scroll-m-20 text-center text-3xl font-semibold tracking-tight first:mt-0">
            {data.isRead ? (
              <Button asChild className="ml-2" onClick={markUnread} size="sm" variant="ghost">
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
                    },
                    body: {
                      isRead: data.isRead || false,
                      isStarred: false,
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
                    },
                    body: {
                      isRead: data.isRead || false,
                      isStarred: true,
                    },
                  })
                }
                size="icon"
                variant="ghost"
              >
                <SolarStarLinear />
              </Button>
            )}
          </h2>
          <h3 className="scroll-m-20 py-1 text-center font-semibold tracking-tight">
            {data.authors?.join(', ')}
            <Badge className="ml-2" variant="outline">
              {articleFeed}
            </Badge>
          </h3>
          <h4 className="flex scroll-m-20 flex-col py-1 text-center font-medium tracking-tight">
            <time dateTime={data.published!}>
              {format(new Date(data.published!), 'MMM d, yyyy HH:mm')}
            </time>
          </h4>
        </header>
        <div className="prose prose-lg prose-pink prose-headings:underline">
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
          {/* {data.youtube ? ( */}
          {/*   <ReactPlayer */}
          {/*     controls */}
          {/*     src={data.url!} */}
          {/*     style={{ aspectRatio: '16/9', height: 'auto', width: '100%' }} */}
          {/*   /> */}
          {/* ) : ( */}
          {/*   [] */}
          {/* )} */}

          {/*{data.enclosures?.map((e) => {
            if (e.mime_type && e.mime_type !== 'application/octet-stream')
              return (
                <MediaPlayer>
                  <MediaPlayerVideo>
                    <source src={e.url} type={e.mime_type} />
                  </MediaPlayerVideo>
                  <MediaPlayerControls className="flex-col items-start gap-2.5">
                    <MediaPlayerControlsOverlay />
                    <MediaPlayerSeek />
                    <div className="flex w-full items-center gap-2">
                      <div className="flex flex-1 items-center gap-2">
                        <MediaPlayerPlay />
                        <MediaPlayerSeekBackward />
                        <MediaPlayerSeekForward />
                        <MediaPlayerVolume expandable />
                        <MediaPlayerTime />
                      </div>
                      <div className="flex items-center gap-2">
                        <MediaPlayerPlaybackSpeed />
                        <MediaPlayerPiP />
                        <MediaPlayerFullscreen />
                      </div>
                    </div>
                  </MediaPlayerControls>
                </MediaPlayer>
              );
            return (
              <img
                aria-label="enclosure image did not include alt text"
                src={e.url}
              />
            );
          })}*/}
        </div>
        <footer className="flex flex-col items-center pt-8">
          <a className="text-primary font-bold hover:underline" href={data.url!}>
            Original article
          </a>
          <div className="grid-flow-row pt-2">
            {/* <BadgeOverflow */}
            {/*   items={data.categories} */}
            {/*   lineCount={2} */}
            {/*   renderBadge={(_, label) => <Badge>{label}</Badge>} */}
            {/* /> */}
          </div>
        </footer>
      </div>
    </article>
  );
}
