import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type Tag, TagInput } from 'emblor';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import MultipleSelector from '@/components/multi-select';
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
import { filterFormSchema } from '@/zod/filter.zod';

export const Route = createFileRoute('/dashboard/filter/new')({
  component: NewFilter,
});

function NewFilter() {
  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });

  const navigate = useNavigate({ from: Route.id });
  const queryClient = useQueryClient();
  const { mutate } = $api.useMutation('post', '/filter', {
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries();
      await navigate({ to: '/dashboard/filter' });
    },
  });

  function onSubmit(values: z.infer<typeof filterFormSchema>) {
    const valuesToSend = {
      name: values.name,
      conditions: {
        keywords: values.keywords?.map((keyword) => keyword.text),
        titleContains: values.titleContains?.map((title) => title.text),
        contentContains: values.contentContains?.map((content) => content.text),
        authors: values.authors?.map((author) => author.text),
        categories: values.categories?.map((category) => category.text),
        feeds: values.feeds?.map((feed) => feed.value),
      },
      action: {
        type: values.type,
        contentWarning: values.contentWarning || null,
      },
      isActive: values.enabled,
    };
    mutate({
      credentials: 'include',
      body: valuesToSend,
    });
  }

  const form = useForm<z.infer<typeof filterFormSchema>>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      keywords: [],
      titleContains: [],
      contentContains: [],
      authors: [],
      categories: [],
      feeds: [],
      type: 'blur',
      contentWarning: '',
      enabled: true,
    },
  });

  const [keywords, setKeywords] = React.useState<Tag[]>([]);
  const [keywordsIndex, setKeywordsIndex] = React.useState<number | null>(0);
  const [titleContains, setTitleContains] = React.useState<Tag[]>([]);
  const [titleContainsIndex, setTitleContainsIndex] = React.useState<
    number | null
  >(0);
  const [contentContains, setContentContains] = React.useState<Tag[]>([]);
  const [contentContainsIndex, setContentContainsIndex] = React.useState<
    number | null
  >(0);
  const [authors, setAuthors] = React.useState<Tag[]>([]);
  const [authorsIndex, setAuthorsIndex] = React.useState<number | null>(0);
  const [categories, setCategories] = React.useState<Tag[]>([]);
  const [categoriesIndex, setCategoriesIndex] = React.useState<number | null>(
    0,
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input placeholder="name" {...field}></Input>
            </FormItem>
          )}
        />
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
              <FormDescription>
                contains keywords (generated with NLP from article)
              </FormDescription>
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
              <FormDescription>title contains</FormDescription>
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
              <FormDescription>content contains</FormDescription>
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
              <FormDescription>contains authors</FormDescription>
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
              <FormDescription>
                contains categories (manually written by feed author)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="feeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feeds</FormLabel>
              <FormControl>
                <MultipleSelector
                  {...field}
                  defaultOptions={feeds?.feeds.map((feed) => ({
                    label: feed.title || feed.url,
                    value: feed.id,
                  }))}
                  placeholder="Select feeds you want to add to your folder..."
                  emptyIndicator={
                    <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                      no results found.
                    </p>
                  }
                />
              </FormControl>
              <FormDescription>entire feed to filter</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blur">Blur</SelectItem>
                <SelectItem value="warn">Warn</SelectItem>
                <SelectItem value="hide">Hide</SelectItem>
              </SelectContent>
            </Select>
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
