import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AppSidebar } from '@/components/app-sidebar';
import { ArticleFilterSelect } from '@/components/article-filter';
import { ModeToggle } from '@/components/mode-toggle';
import { SearchBar } from '@/components/search-bar';
import { Spinner } from '@/components/spinner';
import { LoadingButton } from '@/components/spinner-button';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { authClient } from '@/lib/auth-client';
import { $api } from '@/lib/fetch-client';
import { cn } from '@/lib/utils';
import IconParkOutlineRss from '~icons/icon-park-outline/rss';

export const Route = createFileRoute('/dashboard')({
  component: DashLayout,
  beforeLoad: async ({ context, location }) => {
    if (!context.auth?.session) {
      const { data: session, error } = await authClient.getSession();

      if (!session || error) {
        throw redirect({
          to: '/login',
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
});

const discoverSchema = z.object({
  url: z.url(),
});

const createFeedForm = z.object({
  url: z.url(),
  description: z.string(),
  folderId: z.string().nullable(),
});
function DashLayout() {
  const isMobile = useIsMobile();
  const [step1open, setStep1Open] = React.useState(false);
  const [step2open, setStep2Open] = React.useState(false);
  const [feeds, setFeeds] = React.useState<{ feeds: string[] }>({ feeds: [] });

  const step1Form = useForm<z.infer<typeof discoverSchema>>({
    resolver: zodResolver(discoverSchema),
    defaultValues: {
      url: '',
    },
  });

  const queryClient = useQueryClient();
  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });

  const folderSelect = folders?.map((folder) => ({
    value: folder.id,
    label: folder.name,
  }));
  const step2Form = useForm<z.infer<typeof createFeedForm>>({
    resolver: zodResolver(createFeedForm),
    defaultValues: {
      url: '',
      description: '',
      folderId: null,
    },
  });

  const { mutate: discover, isPending: discoverPending } = $api.useMutation(
    'post',
    '/feed/discover',
  );

  function onDiscoverFeed(values: z.infer<typeof discoverSchema>) {
    discover(
      {
        body: values,
        credentials: 'include',
      },
      {
        onSuccess: (data) => {
          setStep1Open(false);
          step1Form.reset;
          setFeeds(data);

          setStep2Open(true);
        },
      },
    );
  }

  const { mutate, isPending } = $api.useMutation('post', '/feed');

  function onCreateFeed(values: z.infer<typeof createFeedForm>) {
    // Handle form submission here
    mutate(
      { body: values, credentials: 'include' },
      {
        onSuccess: () => {
          setStep2Open(false);
          step2Form.reset();
          queryClient.invalidateQueries({
            queryKey: ['get', '/folder/feeds'],
          });
          queryClient.invalidateQueries({
            queryKey: ['get', '/feed'],
          });
        },
        onError(error) {
          step2Form.reset();
          // @ts-expect-error: error with error types in openapi-typescript
          toast.error('Error adding feed', { description: error.message });
        },
      },
    );
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="right-5 absolute flex items-center gap-2">
              {!isMobile && <SearchBar />}
              <ArticleFilterSelect />
              <ModeToggle />
            </div>
            <div className="group fixed bottom-6 right-6 z-10">
              <Dialog open={step1open} onOpenChange={setStep1Open}>
                <DialogTrigger>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button>
                        <IconParkOutlineRss />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Subscribe to a new feed</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Discover feeds from URL</DialogTitle>
                  </DialogHeader>
                  <Form {...step1Form}>
                    <form className="space-y-8" onSubmit={step1Form.handleSubmit(onDiscoverFeed)}>
                      <FormField
                        control={step1Form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://coolfeed.com"
                                type="url"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This is the URL you would like to find feeds on.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <LoadingButton type="submit" loading={discoverPending}>
                        Find
                      </LoadingButton>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog open={step2open} onOpenChange={setStep2Open}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Feed</DialogTitle>
                  </DialogHeader>
                  <Form {...step2Form}>
                    <form
                      onSubmit={step2Form.handleSubmit(onCreateFeed)}
                      className="space-y-8"
                    >
                      <FormField
                        control={step2Form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="select feed discovered from URL" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {feeds.feeds.map((f) => (
                                  <SelectItem value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This is your feed URL.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step2Form.control}
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
                        control={step2Form.control}
                        name="folderId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Folder</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      'w-[200px] justify-between',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {field.value
                                      ? folderSelect?.find(
                                          (folder) =>
                                            folder.value === field.value,
                                        )?.label
                                      : 'Select folder'}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search folder..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      No folder found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {folderSelect?.map((folder) => (
                                        <CommandItem
                                          value={folder.label}
                                          key={folder.value}
                                          onSelect={() => {
                                            step2Form.setValue(
                                              'folderId',
                                              folder.value,
                                            );
                                          }}
                                        >
                                          {folder.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormDescription>The feed's folder</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <LoadingButton loading={isPending} type="submit">
                        Submit
                      </LoadingButton>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
