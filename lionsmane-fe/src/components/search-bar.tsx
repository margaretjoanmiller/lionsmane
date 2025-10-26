import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import FluentSearch20Filled from '~icons/fluent/search-20-filled';
import IconoirCancel from '~icons/iconoir/cancel';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Form, FormField } from './ui/form';
import { Input } from './ui/input';

export function SearchBar() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const schema = z.object({
    limit: z.number().min(1).max(100).default(10),
    page: z.number().min(1).max(100).default(1),
    query: z.string().min(2).max(256),
  });

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const navigate = useNavigate();

  const onSubmit = (data: z.infer<typeof schema>) => {
    setIsOpen(false);
    navigate({
      search: {
        limit: data.limit,
        page: data.page,
        query: data.query,
      },
      to: '/dashboard/search',
    });
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center align-center" variant="outline">
          <FluentSearch20Filled /> Search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            className="flex items-center align-center m-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <Field className="max-w-[200px]">
                  <Input placeholder="Search..." {...field} />
                </Field>
              )}
            />
            <Button className="ml-4" type="submit">
              Search query
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
