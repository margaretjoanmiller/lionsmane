import { Badge } from '@/components/ui/badge';

export function BadgeOverflow({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  if (items.length >= 4) {
    return (
      <>
        {items.slice(0, 4).map((item, index) => (
          <Badge className="mx-1" key={index}>
            {item}
          </Badge>
        ))}
        <Badge className="mx-1" variant="outline">
          +{items.length - 4} more
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
