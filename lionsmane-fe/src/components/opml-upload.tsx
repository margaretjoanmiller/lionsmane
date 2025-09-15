import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { $api } from '@/lib/fetch-client';

export function OpmlUpload() {
  const form = useForm();

  const { mutate } = $api.useMutation('post', '/feed/import', {
    onSuccess: () => {
      toast('File uploaded, starting import...');
    },
  });

  // @ts-expect-error: Form data typing
  function onSubmit(data) {
    const formData = new FormData();
    formData.append('file', data.file);
    mutate({
      // @ts-expect-error: Form data typing
      body: formData,
      credentials: 'include',
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="my-4 w-2/3 space-y-4"
      >
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="file"
                  placeholder="shadcn"
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              </FormControl>
              <FormDescription>
                This is your OPML file of RSS feeds.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
