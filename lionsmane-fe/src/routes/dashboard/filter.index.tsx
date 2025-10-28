import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';
import type { FilterRule } from '@/types/filter';
import SolarAddCircleLineDuotone from '~icons/solar/add-circle-line-duotone';
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
        return (
          <Link
            className="text-right font-medium"
            params={{ filterId: row.original.id }}
            to="/dashboard/filter/$filterId"
          >
            <StashPencilWritingDuotone className="h-4 w-4" />
            Edit
          </Link>
        );
      },
      header: () => <div className="text-right">Actions</div>,
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
