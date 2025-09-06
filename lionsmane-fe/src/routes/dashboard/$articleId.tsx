import { createFileRoute } from '@tanstack/react-router';
import { $api } from '@/lib/fetch-client';

export const Route = createFileRoute('/dashboard/$articleId')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      $api.queryOptions('get', '/article/{id}', {
        params: {
          path: {
            id: params.articleId,
          },
        },
        credentials: 'include',
      }),
    ),
  component: ArticlePage,
});

function ArticlePage() {
  const articleId = Route.useParams().articleId;
  const { data } = $api.useSuspenseQuery('get', '/article/{id}', {
    params: {
      path: {
        id: articleId,
      },
    },
    credentials: 'include',
  });

  return (
    <div className="bg-card flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <div className="m-6">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          {data.title}
        </h1>
        <div className="prose prose-lg prose-pink">
          {
            <div
              dangerouslySetInnerHTML={{
                __html: data.readableHtml || '<p>error loading</p>',
              }} // we clean this on the backend
            />
          }
          <a href={data.url}>Original article</a>
        </div>
      </div>
    </div>
  );
}
