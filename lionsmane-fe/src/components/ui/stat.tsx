import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function Stat({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg border bg-card p-4 text-card-foreground shadow-sm',
        '**:data-[slot=stat-label]:col-span-1 **:data-[slot=stat-value]:col-span-1',
        '**:data-[slot=stat-indicator]:col-start-2 **:data-[slot=stat-indicator]:row-span-2 **:data-[slot=stat-indicator]:row-start-1 **:data-[slot=stat-indicator]:self-start',
        '**:data-[slot=stat-description]:col-span-2 **:data-[slot=stat-separator]:col-span-2 **:data-[slot=stat-trend]:col-span-2',
        className,
      )}
      data-slot="stat"
      {...props}
    />
  );
}

function StatLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('font-medium text-muted-foreground text-sm', className)}
      data-slot="stat-label"
      {...props}
    />
  );
}

const statIndicatorVariants = cva(
  'flex shrink-0 items-center justify-center [&_svg]:pointer-events-none',
  {
    defaultVariants: {
      color: 'default',
      variant: 'default',
    },
    variants: {
      color: {
        default: 'bg-muted text-muted-foreground',
        error: 'border-destructive/20 bg-destructive/10 text-destructive',
        info: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
        success:
          'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400',
        warning:
          'border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400',
      },
      variant: {
        action:
          "size-8 cursor-pointer rounded-md transition-colors hover:bg-muted/50 [&_svg:not([class*='size-'])]:size-4",
        badge:
          "h-6 min-w-6 rounded-sm border px-1.5 font-medium text-xs [&_svg:not([class*='size-'])]:size-3",
        default: "text-muted-foreground [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8 rounded-md border [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
  },
);

interface StatIndicatorProps
  extends Omit<React.ComponentProps<'div'>, 'color'>,
    VariantProps<typeof statIndicatorVariants> {}

function StatIndicator({
  className,
  variant = 'default',
  color = 'default',
  ...props
}: StatIndicatorProps) {
  return (
    <div
      className={cn(statIndicatorVariants({ className, color, variant }))}
      data-color={color}
      data-slot="stat-indicator"
      data-variant={variant}
      {...props}
    />
  );
}

function StatValue({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('font-semibold text-2xl tracking-tight', className)}
      data-slot="stat-value"
      {...props}
    />
  );
}

function StatTrend({
  className,
  trend,
  ...props
}: React.ComponentProps<'div'> & { trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-medium text-xs [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        {
          'text-green-600 dark:text-green-400': trend === 'up',
          'text-muted-foreground': trend === 'neutral' || !trend,
          'text-red-600 dark:text-red-400': trend === 'down',
        },
        className,
      )}
      data-slot="stat-trend"
      data-trend={trend}
      {...props}
    />
  );
}

function StatSeparator({ ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator className="my-2" data-slot="stat-separator" {...props} />;
}

function StatDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-muted-foreground text-xs', className)}
      data-slot="stat-description"
      {...props}
    />
  );
}

export {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatSeparator,
  StatTrend,
  StatValue,
};
