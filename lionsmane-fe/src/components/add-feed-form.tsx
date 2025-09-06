import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { $api } from '@/lib/fetch-client';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';

const formSchema = z.object({
  url: z.url(),
  description: z.string(),
  folderId: z.string().nullable(),
});

export function AddFeedForm() {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      description: '',
      folderId: null,
    },
  });
  return (
    <Dialog>
      <DialogTrigger>Add Feed</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feed</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://coolfeed.com/feed" {...field} />
                  </FormControl>
                  <FormDescription>This is your feed URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Cool feed" {...field} />
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
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <FormControl>
                    
                  </FormControl>
                  <FormDescription>This is your feed folder.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
