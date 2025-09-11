import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { $api } from '@/lib/fetch-client';
import type { FilterRule } from '@/types/filter';
import StashPencilWritingDuotone from '~icons/stash/pencil-writing-duotone';

export const Route = createFileRoute('/dashboard/filter/')({
  component: FiltersDash,
});

function FiltersDash() {
  const { data } = $api.useQuery('get', '/filter', {
    credentials: 'include',
  });

  const columns: ColumnDef<FilterRule>[] = [
    {
      accessorKey: 'conditions',
      header: () => <div className="text-right">Conditions</div>,
      cell: ({ row }) => {
        const conditions = row.original.conditions;
        return (
          <>
            <Badge>Keywords: {conditions.keywords?.length}</Badge>
            <Badge>Title Contains: {conditions.titleContains?.length}</Badge>
            <Badge>
              Content Contains: {conditions.contentContains?.length}
            </Badge>
            <Badge>Authors: {conditions.authors?.length}</Badge>
            <Badge>Categories: {conditions.categories?.length}</Badge>
            <Badge>Feeds: {conditions.feeds?.length}</Badge>
          </>
        );
      },
    },
    {
      accessorKey: 'action',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        const action = row.original.action;
        return <div className="text-right font-medium">{action.type}</div>;
      },
    },
    {
      accessorKey: 'enabled',
      header: () => <div className="text-right">Enabled</div>,
      cell: ({ row }) => {
        const enabled = row.original.isActive;
        return (
          <div className="text-right font-medium">{enabled ? 'Yes' : 'No'}</div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <Link
            to="/dashboard/filter/$filterId"
            params={{ filterId: row.original.id }}
            className="text-right font-medium"
          >
            <StashPencilWritingDuotone className="h-4 w-4" />
            Edit
          </Link>
        );
      },
    },
  ];
  return (
    <>
      <DataTable columns={columns} data={data || []} />
      <Link to="/dashboard/filter/new">New filter rule</Link>
    </>
  );
}
