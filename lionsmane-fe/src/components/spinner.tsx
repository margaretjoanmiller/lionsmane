// thanks to hsuanyi-chou on github!
// https://github.com/hsuanyi-chou/shadcn-ui-expansions

import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib/utils';
import TablerLoader2 from '~icons/tabler/loader-2';

const spinnerVariants = cva('flex-col items-center justify-center', {
  defaultVariants: {
    show: true,
  },
  variants: {
    show: {
      false: 'hidden',
      true: 'flex',
    },
  },
});

const loaderVariants = cva('animate-spin text-primary', {
  defaultVariants: {
    size: 'medium',
  },
  variants: {
    size: {
      large: 'size-12',
      medium: 'size-8',
      small: 'size-6',
    },
  },
});

interface SpinnerContentProps
  extends VariantProps<typeof spinnerVariants>,
    VariantProps<typeof loaderVariants> {
  className?: string;
  children?: React.ReactNode;
}

export function Spinner({
  size,
  show,
  children,
  className,
}: SpinnerContentProps) {
  return (
    <span className={spinnerVariants({ show })}>
      <TablerLoader2 className={cn(loaderVariants({ size }), className)} />
      {children}
    </span>
  );
}
