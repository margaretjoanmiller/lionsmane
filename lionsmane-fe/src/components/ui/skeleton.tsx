import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-card animate-pulse rounded-md', className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
