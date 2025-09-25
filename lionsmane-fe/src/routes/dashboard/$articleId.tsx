import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
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
  if (session?.user.hasReadeckKey === true) {
    setReadeckkey();
  }

  const articleId = Route.useParams().articleId;
  const queryClient = useQueryClient();
  const { data } = $api.useSuspenseQuery('get', '/article/{id}', {
    params: {
      path: {
        id: articleId,
      },
    },
    credentials: 'include',
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
    onSuccess: () => {
      toast.info('Saved to readeck');
    },
    onError(error) {
      toast.error('Error saving to readeck', { description: error.message });
    },
  });

  return (
    <div className="bg-card flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <div className="m-6">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          {data.title}
          {data.isStarred && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                mutate({
                  params: {
                    path: {
                      id: data.id,
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
          {!data.isStarred && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                mutate({
                  params: {
                    path: {
                      id: data.id,
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
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  requestFullArticleText({
                    params: { path: { id: data.id } },
                    credentials: 'include',
                  })
                }
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
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    readLater({
                      body: {
                        url: data.url,
                      },
                      credentials: 'include',
                    })
                  }
                >
                  <SolarBookBookmarkLineDuotone />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to readeck</TooltipContent>
            </Tooltip>
          )}
        </h1>
        <h2 className="text-center font-bold">
          {data.authors.map((author) => author.name).join(', ')}
        </h2>
        <div className="prose prose-lg prose-pink">
          {
            <div
              dangerouslySetInnerHTML={{
                __html:
                  data.fullArticleHtml ||
                  data.readableHtml ||
                  '<p>error loading</p>',
              }} // we clean this on the backend
            />
          }
          <a href={data.url!}>Original article</a>
        </div>
      </div>
    </div>
  );
}
