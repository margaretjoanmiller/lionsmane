import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';
import SolarGlassesLineDuotone from '~icons/solar/glasses-line-duotone';
import SolarStarBold from '~icons/solar/star-bold';
import SolarStarLinear from '~icons/solar/star-linear';

export const Route = createFileRoute('/dashboard/$articleId')({
  component: ArticlePage,
});

function ArticlePage() {
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

  const { mutate, error } = $api.useMutation('patch', '/article/status/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['get', '/article/{id}'],
      });
    },
    onError: (error) => {
      toast.error('Failed to update article status', {
        description: error.message,
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
      onError: (error) => {
        toast.error('Failed to fetch full article text', {
          description: error.message,
        });
      },
    },
  );

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
        </h1>
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
          <a href={data.url}>Original article</a>
        </div>
      </div>
    </div>
  );
}
