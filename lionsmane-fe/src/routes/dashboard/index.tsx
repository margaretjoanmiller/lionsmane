import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/')({
  component: DashIndex,
});

function DashIndex() {
  return (
    <>
      <p>hi</p>
    </>
  );
}
