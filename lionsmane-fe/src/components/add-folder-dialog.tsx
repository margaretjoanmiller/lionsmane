import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { $api } from '@/lib/fetch-client';
import MultipleSelector from './multi-select';
import { SpinnerButton } from './spinner-button';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { FieldGroup } from './ui/field';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  feedIds: z.array(
    z.object({
      label: z.string().min(1).max(255),
      value: z.string().uuid(),
    }),
  ),
  name: z.string().min(1).max(255),
});

export function AddFolderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });

  const feedSelect =
    feeds?.map((feed) => ({
      label: feed.title || feed.url,
      value: feed.id,
    })) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      feedIds: [],
      name: '',
    },
    resolver: zodResolver(formSchema),
  });

  const { mutate, isPending } = $api.useMutation('post', '/folder');
  const queryClient = useQueryClient();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const bodyToSend = {
      feedIds: values.feedIds.map((feed) => feed.value),
      name: values.name,
    };
    mutate(
      { body: bodyToSend, credentials: 'include' },
      {
        onError: (error) => {
          toast.error('Error adding folder', {
            description: String(error),
          });
        },
        onSuccess: async () => {
          toast.success('Folder added');
          onOpenChange(false);
          await queryClient.invalidateQueries({ queryKey: ['get', '/feed'] });
          await queryClient.invalidateQueries({
            queryKey: ['get', '/folder/feeds'],
          });
          form.reset();
        },
      },
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Folder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="m-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feedIds"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel>Feeds</FormLabel>
                    <FormControl>
                      <MultipleSelector
                        {...field}
                        defaultOptions={feedSelect}
                        emptyIndicator={
                          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                            no results found.
                          </p>
                        }
                        placeholder="Select feeds you want to add to your folder..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </FieldGroup>
            <div className="flex flex-row">
              {isPending ? (
                <SpinnerButton />
              ) : (
                <Button type="submit">Add folder</Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
