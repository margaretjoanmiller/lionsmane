import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type Tag, TagInput } from 'emblor';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
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
    authors: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
    categories: z
      .array(z.object({ id: z.string(), text: z.string() }))
      .optional(),
    contentContains: z
      .array(z.object({ id: z.string(), text: z.string() }))
      .optional(),
    contentWarning: z.string().max(512).optional(),
    enabled: z.boolean(),
    feeds: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
    keywords: z
      .array(z.object({ id: z.string(), text: z.string() }))
      .optional(),
    titleContains: z
      .array(z.object({ id: z.string(), text: z.string() }))
      .optional(),
    type: z.enum(['blur', 'markRead', 'hide']),
  });

  const filterId = Route.useParams().filterId;
  const { data } = $api.useSuspenseQuery('get', '/filter/{id}', {
    credentials: 'include',
    params: {
      path: {
        id: filterId,
      },
    },
  });

  const [keywords, setKeywords] = React.useState<Tag[]>(
    data.conditions.keywords?.map((keyword) => ({
      id: keyword,
      text: keyword,
    })) || [],
  );
  const [keywordsIndex, setKeywordsIndex] = React.useState<number | null>(0);
  const [titleContains, setTitleContains] = React.useState<Tag[]>(
    data.conditions.titleContains?.map((title) => ({
      id: title,
      text: title,
    })) || [],
  );
  const [titleContainsIndex, setTitleContainsIndex] = React.useState<
    number | null
  >(0);
  const [contentContains, setContentContains] = React.useState<Tag[]>(
    data.conditions.contentContains?.map((content) => ({
      id: content,
      text: content,
    })) || [],
  );
  const [contentContainsIndex, setContentContainsIndex] = React.useState<
    number | null
  >(0);
  const [authors, setAuthors] = React.useState<Tag[]>(
    data.conditions.authors?.map((author) => ({
      id: author,
      text: author,
    })) || [],
  );
  const [authorsIndex, setAuthorsIndex] = React.useState<number | null>(0);
  const [categories, setCategories] = React.useState<Tag[]>(
    data.conditions.categories?.map((category) => ({
      id: category,
      text: category,
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
      action: {
        contentWarning: values.contentWarning,
        type: values.type,
      },
      conditions: {
        authors: values.authors?.map((author) => author.text),
        categories: values.categories?.map((category) => category.text),
        contentContains: values.contentContains?.map((content) => content.text),
        feeds: values.feeds?.map((feed) => feed.text),
        keywords: values.keywords?.map((keyword) => keyword.text),
        titleContains: values.titleContains?.map((title) => title.text),
      },
      isActive: values.enabled,
    };
    mutate({
      body: valuesToSend,
      credentials: 'include',
      params: {
        path: {
          id: filterId,
        },
      },
    });
  }

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      authors: authors,
      categories: categories,
      contentContains: contentContains,
      contentWarning: data.action.contentWarning || undefined,
      enabled: data.isActive,
      feeds: feeds?.map((f) => ({ id: f.id, text: f.title })),
      keywords: keywords,
      titleContains: titleContains,
      type: data.action.type,
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                  <TagInput
                    {...field}
                    activeTagIndex={keywordsIndex}
                    placeholder="Keyword1, Keyword2, Keyword3"
                    setActiveTagIndex={setKeywordsIndex}
                    setTags={(newTags) => {
                      setKeywords(newTags);
                      form.setValue('keywords', newTags as [Tag, ...Tag[]]);
                    }}
                    tags={keywords}
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
                    activeTagIndex={titleContainsIndex}
                    placeholder="Title1, Title2, Title3"
                    setActiveTagIndex={setTitleContainsIndex}
                    setTags={(newTags) => {
                      setTitleContains(newTags);
                      form.setValue(
                        'titleContains',
                        newTags as [Tag, ...Tag[]],
                      );
                    }}
                    tags={titleContains}
                  />
                </FormControl>
                <FormDescription>
                  This is your feed description.
                </FormDescription>
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
                    activeTagIndex={contentContainsIndex}
                    onChange={field.onChange}
                    placeholder="Content1, Content2, Content3"
                    setActiveTagIndex={setContentContainsIndex}
                    setTags={(newTags) => {
                      setContentContains(newTags);
                      form.setValue(
                        'contentContains',
                        newTags as [Tag, ...Tag[]],
                      );
                    }}
                    tags={contentContains}
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
                    activeTagIndex={authorsIndex}
                    placeholder="Author1, Author2, Author3"
                    setActiveTagIndex={setAuthorsIndex}
                    setTags={(newTags) => {
                      setAuthors(newTags);
                      form.setValue('authors', newTags as [Tag, ...Tag[]]);
                    }}
                    tags={authors}
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
                    activeTagIndex={categoriesIndex}
                    placeholder="Category1, Category2, Category3"
                    setActiveTagIndex={setCategoriesIndex}
                    setTags={(newTags) => {
                      setCategories(newTags);
                      form.setValue('categories', newTags as [Tag, ...Tag[]]);
                    }}
                    tags={categories}
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
                      {feeds?.map((feed) => (
                        <SelectItem key={feed.id} value={feed.id}>
                          {feed.title || feed.url}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  These are your filtered feeds.
                </FormDescription>
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
        </FieldGroup>
        <Button className="pt-8" type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
}
