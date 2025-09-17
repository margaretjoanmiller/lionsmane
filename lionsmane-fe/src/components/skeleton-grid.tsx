import { Skeleton } from './ui/skeleton';

export function SkeletonGrid() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
