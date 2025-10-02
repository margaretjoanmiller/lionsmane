import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FieldGroup } from '@/components/ui/field';
import {
  SearchField,
  SearchFieldClear,
  SearchFieldInput,
} from '@/components/ui/searchfield';
import FluentSearch20Filled from '~icons/fluent/search-20-filled';
import IconoirCancel from '~icons/iconoir/cancel';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Form, FormField } from './ui/form';

export function SearchBar() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const schema = z.object({
    query: z.string().min(2).max(256),
    page: z.number().min(1).max(100).default(1),
    limit: z.number().min(1).max(100).default(10),
  });

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const navigate = useNavigate();

  const onSubmit = (data: z.infer<typeof schema>) => {
    setIsOpen(false);
    navigate({
      to: '/dashboard/search',
      search: {
        query: data.query,
        page: data.page,
        limit: data.limit,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center align-center">
          <FluentSearch20Filled /> Search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-center align-center m-4"
          >
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <SearchField className="max-w-[200px]">
                  <FieldGroup>
                    <FluentSearch20Filled
                      aria-hidden
                      className="size-4 text-muted-foreground"
                    />
                    <SearchFieldInput placeholder="Search..." {...field} />
                    <SearchFieldClear>
                      <IconoirCancel aria-hidden className="size-4" />
                    </SearchFieldClear>
                  </FieldGroup>
                </SearchField>
              )}
            />
            <Button type="submit" className="ml-2">
              Search query
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
