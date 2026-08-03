import { Badge } from '@/components/ui/badge';

export function BadgeOverflow({ items, width }: { items: string[]; width: number }) {
  if (items.length === 0) {
    return null;
  }
  if (items.length > width) {
    return (
      <>
        {items.slice(0, width).map((item, index) => (
          <Badge className="mx-1" key={index}>
            {item}
          </Badge>
        ))}
        <Badge className="mx-1" variant="outline">
          +{items.length - width} more
        </Badge>
      </>
    );
  } else {
    return (
      <>
        {items.map((item, index) => (
          <Badge className="mx-1" key={index}>
            {item}
          </Badge>
        ))}
      </>
    );
  }
}
