import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type Tag, TagInput } from 'emblor';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { $api } from '@/lib/fetch-client';

export const Route = createFileRoute('/dashboard/filter/$filterId')({
  component: RouteComponent,
});

function RouteComponent() {
  const formSchema = z.object({
    keywords: z
      .array(z.object({ text: z.string(), id: z.string() }))
      .optional(),
    titleContains: z
      .array(z.object({ text: z.string(), id: z.string() }))
      .optional(),
    contentContains: z
      .array(z.object({ text: z.string(), id: z.string() }))
      .optional(),
    authors: z.array(z.object({ text: z.string(), id: z.string() })).optional(),
    categories: z
      .array(z.object({ text: z.string(), id: z.string() }))
      .optional(),
    feeds: z.array(z.object({ text: z.string(), id: z.string() })).optional(),
    type: z.enum(['blur', 'markRead', 'hide']),
    contentWarning: z.string().max(512).optional(),
    enabled: z.boolean(),
  });

  const filterId = Route.useParams().filterId;
  const { data } = $api.useSuspenseQuery('get', '/filter/{id}', {
    params: {
      path: {
        id: filterId,
      },
    },
    credentials: 'include',
  });

  const [keywords, setKeywords] = React.useState<Tag[]>(
    data.conditions.keywords?.map((keyword) => ({
      text: keyword,
      id: keyword,
    })) || [],
  );
  const [keywordsIndex, setKeywordsIndex] = React.useState<number | null>(0);
  const [titleContains, setTitleContains] = React.useState<Tag[]>(
    data.conditions.titleContains?.map((title) => ({
      text: title,
      id: title,
    })) || [],
  );
  const [titleContainsIndex, setTitleContainsIndex] = React.useState<
    number | null
  >(0);
  const [contentContains, setContentContains] = React.useState<Tag[]>(
    data.conditions.contentContains?.map((content) => ({
      text: content,
      id: content,
    })) || [],
  );
  const [contentContainsIndex, setContentContainsIndex] = React.useState<
    number | null
  >(0);
  const [authors, setAuthors] = React.useState<Tag[]>(
    data.conditions.authors?.map((author) => ({
      text: author,
      id: author,
    })) || [],
  );
  const [authorsIndex, setAuthorsIndex] = React.useState<number | null>(0);
  const [categories, setCategories] = React.useState<Tag[]>(
    data.conditions.categories?.map((category) => ({
      text: category,
      id: category,
    })) || [],
  );
  const [categoriesIndex, setCategoriesIndex] = React.useState<number | null>(
    0,
  );

  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });

  const queryClient = useQueryClient();

  const navigate = useNavigate({ from: '/dashboard/filter/$filterId' });

  const { mutate } = $api.useMutation('put', '/filter/{id}', {
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries();
      await navigate({ to: '/dashboard/filter' });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const valuesToSend = {
      conditions: {
        keywords: values.keywords?.map((keyword) => keyword.text),
        titleContains: values.titleContains?.map((title) => title.text),
        contentContains: values.contentContains?.map((content) => content.text),
        authors: values.authors?.map((author) => author.text),
        categories: values.categories?.map((category) => category.text),
        feeds: values.feeds?.map((feed) => feed.text),
      },
      action: {
        type: values.type,
        contentWarning: values.contentWarning,
      },
      isActive: values.enabled,
    };
    mutate({
      params: {
        path: {
          id: filterId,
        },
      },
      credentials: 'include',
      body: valuesToSend,
    });
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: keywords,
      titleContains: titleContains,
      contentContains: contentContains,
      authors: authors,
      categories: categories,
      feeds: feeds?.feeds.map((f) => ({ text: f.title, id: f.id })),
      type: data.action.type,
      contentWarning: data.action.contentWarning || undefined,
      enabled: data.isActive,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  tags={keywords}
                  activeTagIndex={keywordsIndex}
                  setActiveTagIndex={setKeywordsIndex}
                  setTags={(newTags) => {
                    setKeywords(newTags);
                    form.setValue('keywords', newTags as [Tag, ...Tag[]]);
                  }}
                  placeholder="Keyword1, Keyword2, Keyword3"
                />
              </FormControl>
              <FormDescription>These are your keywords.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="titleContains"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  tags={titleContains}
                  activeTagIndex={titleContainsIndex}
                  setActiveTagIndex={setTitleContainsIndex}
                  setTags={(newTags) => {
                    setTitleContains(newTags);
                    form.setValue('titleContains', newTags as [Tag, ...Tag[]]);
                  }}
                  placeholder="Title1, Title2, Title3"
                />
              </FormControl>
              <FormDescription>This is your feed description.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contentContains"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Contains</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  tags={contentContains}
                  activeTagIndex={contentContainsIndex}
                  setActiveTagIndex={setContentContainsIndex}
                  setTags={(newTags) => {
                    setContentContains(newTags);
                    form.setValue(
                      'contentContains',
                      newTags as [Tag, ...Tag[]],
                    );
                  }}
                  onChange={field.onChange}
                  placeholder="Content1, Content2, Content3"
                />
              </FormControl>
              <FormDescription>This is your feed content.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="authors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authors</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  tags={authors}
                  activeTagIndex={authorsIndex}
                  setActiveTagIndex={setAuthorsIndex}
                  setTags={(newTags) => {
                    setAuthors(newTags);
                    form.setValue('authors', newTags as [Tag, ...Tag[]]);
                  }}
                  placeholder="Author1, Author2, Author3"
                />
              </FormControl>
              <FormDescription>This is your feed authors.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  tags={categories}
                  activeTagIndex={categoriesIndex}
                  setActiveTagIndex={setCategoriesIndex}
                  setTags={(newTags) => {
                    setCategories(newTags);
                    form.setValue('categories', newTags as [Tag, ...Tag[]]);
                  }}
                  placeholder="Category1, Category2, Category3"
                />
              </FormControl>
              <FormDescription>This is your feed categories.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="feeds"
          render={() => (
            <FormItem>
              <FormLabel>Feeds</FormLabel>
              <FormControl>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a feed" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeds?.feeds.map((feed) => (
                      <SelectItem key={feed.id} value={feed.id}>
                        {feed.title || feed.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>These are your filtered feeds.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch('type') === 'blur' && (
          <FormField
            control={form.control}
            name="contentWarning"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Warning</FormLabel>
                <FormControl>
                  <Input
                    placeholder="This content has been blurred"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This is the content warning shown when the action is set to
                  blur.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
