import { $api } from '@/lib/fetch-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { TagInput, type Tag } from 'emblor';
import { Button } from '@/components/ui/button';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { filterFormSchema } from '@/zod/filter.zod';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
        feeds: values.feeds,
      },
      action: {
        type: values.type,
        contentWarning: values.contentWarning,
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
          render={({ field }) => (
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
