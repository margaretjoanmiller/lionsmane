import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { $api } from '@/lib/fetch-client';
import type { FilterRule } from '@/types/filter';
import MdiMoreHoriz from '~icons/mdi/more-horiz';
import SolarAddCircleLineDuotone from '~icons/solar/add-circle-line-duotone';

export const Route = createFileRoute('/dashboard/filter/')({
  component: FiltersDash,
});

function FiltersDash() {
  const queryClient = useQueryClient();

  const { data } = $api.useQuery('get', '/filter', {
    credentials: 'include',
  });

  const { mutate } = $api.useMutation('delete', '/filter/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['get', '/filter'] });
    },
  });

  const columns: ColumnDef<FilterRule>[] = [
    {
      accessorKey: 'conditions',
      cell: ({ row }) => {
        const conditions = row.original.conditions;
        return (
          <div className="space-x-1">
            <Badge>Keywords: {conditions.keywords?.length}</Badge>
            <Badge>Title Contains: {conditions.titleContains?.length}</Badge>
            <Badge>
              Content Contains: {conditions.contentContains?.length}
            </Badge>
            <Badge>Authors: {conditions.authors?.length}</Badge>
            <Badge>Categories: {conditions.categories?.length}</Badge>
            <Badge>Feeds: {conditions.feeds?.length}</Badge>
          </div>
        );
      },
      header: () => <div className="text-right">Conditions</div>,
    },
    {
      accessorKey: 'action',
      cell: ({ row }) => {
        const action = row.original.action;
        return <div className="text-right font-medium">{action.type}</div>;
      },
      header: () => <div className="text-right">Action</div>,
    },
    {
      accessorKey: 'enabled',
      cell: ({ row }) => {
        const enabled = row.original.isActive;
        return (
          <div className="text-right font-medium">{enabled ? 'Yes' : 'No'}</div>
        );
      },
      header: () => <div className="text-right">Enabled</div>,
    },
    {
      cell: ({ row }) => {
        const filter = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MdiMoreHoriz />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  className="text-right font-medium"
                  params={{ filterId: filter.id }}
                  to="/dashboard/filter/$filterId"
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  mutate({
                    credentials: 'include',
                    params: {
                      path: {
                        id: filter.id,
                      },
                    },
                  });
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
      id: 'actions',
    },
  ];
  return (
    <>
      <DataTable columns={columns} data={data || []} />
      <Button asChild className="max-w-1/6" variant="secondary">
        <Link to="/dashboard/filter/new">
          <SolarAddCircleLineDuotone />
          New filter rule
        </Link>
      </Button>
    </>
  );
}
