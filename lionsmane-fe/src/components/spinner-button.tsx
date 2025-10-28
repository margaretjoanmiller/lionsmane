import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function SpinnerButton() {
  return (
    <Button disabled size="sm">
      <Spinner />
      Loading...
    </Button>
  );
}
