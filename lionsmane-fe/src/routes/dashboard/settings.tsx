import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTable } from '@/components/data-table';
import MultipleSelector from '@/components/multi-select';
import { OpmlUpload } from '@/components/opml-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { authClient } from '@/lib/auth-client';
import { $api } from '@/lib/fetch-client';
import { cn } from '@/lib/utils';
import { usePrefStore } from '@/stores/userPref.store';
import type { Feed } from '@/types/feed';
import type { Folder } from '@/types/folder';
import MdiMoreHoriz from '~icons/mdi/more-horiz';

export const Route = createFileRoute('/dashboard/settings')({
  component: Settings,
});

function Settings() {
  // Two factor auth
  const user = authClient.useSession();
  const setReadeckkey = usePrefStore((state) => state.setToTrue);
  const unsetReadeckkey = usePrefStore((state) => state.setToFalse);
  if (user.data?.user.hasReadeckKey === true) {
    setReadeckkey();
  } else {
    unsetReadeckkey();
  }
  const [isEnablingTwoFactor, setIsEnablingTwoFactor] = React.useState(false);

  const [tfaURI, setTfaURI] = React.useState<string | null>(null);
  const twoFactorForm = useForm({
    resolver: zodResolver(z.object({ password: z.string().min(15) })),
    defaultValues: {
      password: '',
    },
  });
  const twoFactorConfirmForm = useForm({
    resolver: zodResolver(z.object({ code: z.string().min(6).max(6) })),
    defaultValues: {
      code: '',
    },
  });
  // readlater api form
  const apiKeySchema = z.object({
    apiKey: z.string(),
    apiURL: z.url(),
  });

  const apiKeyForm = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: '',
      apiURL: '',
    },
  });

  // feed form
  const [feedFormOpen, setFeedFormOpen] = React.useState(false);
  const feedFormSchema = z.object({
    feedId: z.uuid(),
    url: z.url(),
    description: z.string().optional(),
    folderId: z.string().nullable(),
  });
  const feedForm = useForm<z.infer<typeof feedFormSchema>>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: {
      feedId: '',
      url: '',
      description: undefined,
      folderId: undefined,
    },
  });

  const { mutate: updateFeed } = $api.useMutation('patch', '/feed/{id}');

  const queryClient = useQueryClient();

  const { mutate: deleteFeed } = $api.useMutation('delete', '/feed/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  // folder form
  const [folderFormOpen, setFolderFormOpen] = React.useState(false);
  const folderFormSchema = z.object({
    folderId: z.uuid(),
    feedIds: z.array(z.object({ value: z.uuid(), label: z.string() })),
    name: z.string().min(2).max(100),
  });
  const folderForm = useForm<z.infer<typeof folderFormSchema>>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      folderId: '',
      feedIds: [],
      name: '',
    },
  });

  const { mutate: updateFolder } = $api.useMutation('patch', '/folder/{id}');

  const { data: feeds } = $api.useQuery('get', '/feed', {
    credentials: 'include',
  });
  const feedSelect = feeds?.feeds.map((feed) => ({
    label: feed.title,
    value: feed.id,
  }));

  const { data: folders } = $api.useQuery('get', '/folder', {
    credentials: 'include',
  });
  const folderSelect =
    folders?.map((folder) => ({
      label: folder.name,
      value: folder.id,
    })) || [];

  function onSubmitFeed(values: z.infer<typeof feedFormSchema>) {
    updateFeed(
      {
        body: values,
        params: {
          path: { id: values.feedId },
        },
        credentials: 'include',
      },
      {
        onSuccess: () => {
          toast.success('Successfully edited subscription');
          feedForm.reset();
        },
        onError: (error) => {
          toast.error('Error editing subscription', {
            description: error.message,
          });
        },
      },
    );
  }

  const { mutate: apiKey } = $api.useMutation('post', '/readlater/configure', {
    onSuccess: () => {
      toast.info('Saved your readeck API settings');
      setReadeckkey();
    },
    onError: (error) => {
      toast.error('Error saving to readeck', { description: error.message });
    },
  });

  function submitApiKey(values: z.infer<typeof apiKeySchema>) {
    apiKey({
      body: {
        ...values,
      },
      credentials: 'include',
    });
  }

  const columns: ColumnDef<Feed>[] = [
    {
      accessorKey: 'url',
      header: () => <div className="text-right">URL</div>,
      cell: ({ row }) => {
        const url =
          row.original.url.length > 50
            ? `${row.original.url.slice(0, 50)}...`
            : row.original.url;
        return <div className="text-right font-medium">{url}</div>;
      },
    },
    {
      accessorKey: 'title',
      header: () => <div className="text-right">Title</div>,
      cell: ({ row }) => {
        const title = row.original.title;
        return <div className="text-right font-medium">{title}</div>;
      },
    },
    {
      accessorKey: 'updated',
      header: () => <div className="text-right">Updated</div>,
      cell: ({ row }) => {
        const updated = row.original.updated;
        return <div className="text-right font-medium">{updated}</div>;
      },
    },
    {
      id: 'edit',
      cell: ({ row }) => {
        return (
          <Dialog
            open={feedFormOpen}
            onOpenChange={(open) => {
              setFeedFormOpen(open);
              const feed = row.original;
              feedForm.setValue('feedId', feed.id);
              feedForm.setValue('url', feed.url);
              feedForm.setValue('description', feed.description || '');
            }}
          >
            <DialogTrigger>
              <Button variant="outline">
                <PencilIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit feed</DialogTitle>
              </DialogHeader>

              <Form {...feedForm}>
                <form
                  onSubmit={feedForm.handleSubmit(onSubmitFeed)}
                  className="space-y-8"
                >
                  <FormField
                    control={feedForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://coolfeed.com/feed"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is your feed URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={feedForm.control}
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
                    control={feedForm.control}
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
                                      (folder) => folder.value === field.value,
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
                                <CommandEmpty>No folder found.</CommandEmpty>
                                <CommandGroup>
                                  {folderSelect?.map((folder) => (
                                    <CommandItem
                                      value={folder.label}
                                      key={folder.value}
                                      onSelect={() => {
                                        feedForm.setValue(
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
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const feed = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MdiMoreHoriz className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  deleteFeed({
                    params: {
                      path: {
                        id: feed.id,
                      },
                    },
                    credentials: 'include',
                  })
                }
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  function onSubmitFolder(values: z.infer<typeof folderFormSchema>) {
    const feeds = values.feedIds.map((feed) => feed.value);
    updateFolder(
      {
        body: {
          feedIds: feeds,
          name: values.name,
        },
        params: {
          path: {
            id: values.folderId,
          },
        },
      },
      {
        onSuccess: () => {
          folderForm.reset();
        },
      },
    );
  }

  const folderColumns: ColumnDef<Folder>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'feeds',
      header: 'Feeds',
      accessorKey: 'feeds',
      cell: ({ row }) => {
        const feeds = row.original.feedIds;
        return (
          <div className="flex items-center">
            <span>{feeds.length}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const folder = row.original;
        return (
          <Dialog
            open={folderFormOpen}
            onOpenChange={(open) => {
              setFolderFormOpen(open);
              if (open) {
                folderForm.setValue('folderId', folder.id);
                folderForm.setValue('name', folder.name);
                folderForm.setValue(
                  'feedIds',
                  folder.feedIds.map((feed) => ({
                    value: feed,
                    label:
                      feeds?.feeds.find((f) => f.id === feed)?.title ||
                      'Unnamed feed',
                  })),
                );
              }
            }}
          >
            <DialogTrigger>
              <Button variant="outline">
                <PencilIcon />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Folder</DialogTitle>
              </DialogHeader>
              <Form {...folderForm}>
                <form
                  onSubmit={folderForm.handleSubmit(onSubmitFolder)}
                  className="m-8"
                >
                  <FormField
                    control={folderForm.control}
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
                    control={folderForm.control}
                    name="feedIds"
                    render={({ field }) => (
                      <FormItem className="my-6">
                        <FormLabel>Feeds</FormLabel>
                        <FormControl>
                          <MultipleSelector
                            {...field}
                            defaultOptions={feedSelect}
                            placeholder="Select feeds you want to add to your folder..."
                            emptyIndicator={
                              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                                no results found.
                              </p>
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Add Folder</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        );
      },
    },
  ];

  const downloadUrl =
    import.meta.env.VITE_API_URL + '/feed/export' ||
    'http://localhost:8181' + '/feed/export';

  const twoFactorEnabled = user?.data?.user.twoFactorEnabled;

  async function onEnableTwoFactor(values: { password: string }) {
    const { data, error } = await authClient.twoFactor.enable({
      password: values.password,
    });

    if (error || !data) {
      toast.error(
        'Could not enable 2FA, please check your password and try again.',
      );
    }
    const { data: uri, error: uriError } =
      await authClient.twoFactor.getTotpUri({ password: values.password });
    if (uriError || !uri) {
      toast.error('Could not get TOTP URI, please try again.');
      return;
    }
    setTfaURI(uri.totpURI);
    setIsEnablingTwoFactor(true);

    toast.success('Scan the QR code with your authenticator app.');
  }

  async function onConfirmTwoFactor(values: { code: string }) {
    const { data, error } = await authClient.twoFactor.verifyTotp({
      code: values.code, // required
      trustDevice: true,
    });
    if (error || !data) {
      toast.error('Could not verify TOTP, please try again.');
      return;
    }
    toast.success('Two-Factor Authentication enabled successfully!');
    setIsEnablingTwoFactor(false);
    twoFactorConfirmForm.reset();
  }

  if (!feeds || !folders) {
    return null;
  }

  return (
    <div className="flex flex-col container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <h2 className="text-xl font-semibold mb-4">Manage account</h2>
      {!twoFactorEnabled && (
        <Form {...twoFactorForm}>
          <form onSubmit={twoFactorForm.handleSubmit(onEnableTwoFactor)}>
            <FormField
              control={twoFactorForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Two-Factor Authentication</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="current password"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Enable</Button>
          </form>
        </Form>
      )}
      {isEnablingTwoFactor && (
        <div className="my-4 p-4">
          <Card className="card bg-white w-md">
            <CardContent>
              <QRCode value={tfaURI || ''} />
            </CardContent>
          </Card>
          <p className="my-2">Scan this QR code with your authenticator app.</p>
          <Form {...twoFactorConfirmForm}>
            <form
              onSubmit={twoFactorConfirmForm.handleSubmit(onConfirmTwoFactor)}
            >
              <FormField
                control={twoFactorConfirmForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-Time Password</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormDescription>
                      Please enter the one-time password sent to your phone.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-4">Manage Feeds</h2>
      <DataTable columns={columns} data={feeds?.feeds} />
      <div className="my-6">
        <DataTable columns={folderColumns} data={folders} />
      </div>
      <div className="my-6">
        <Label>Import OPML File</Label>
        <OpmlUpload />
        <a
          className="no-underline hover:underline decoration-pink-400 my-2"
          href={downloadUrl}
          download="feeds.opml"
        >
          <Label>Export OPML File</Label>
        </a>
      </div>
      <h2 className="text-xl font-semibold mb-4">API Keys</h2>
      <Form {...apiKeyForm}>
        <form onSubmit={apiKeyForm.handleSubmit(submitApiKey)}>
          <FormField
            control={apiKeyForm.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ApiKey</FormLabel>
                <FormControl>
                  <Input placeholder="key" {...field} />
                </FormControl>
                <FormDescription>This is your readeck api key.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={apiKeyForm.control}
            name="apiURL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ApiURL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://readeck.org"
                    {...field}
                  />
                </FormControl>
                <FormDescription>This is your readeck API url.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Configure readeck</Button>
        </form>
      </Form>
    </div>
  );
}
