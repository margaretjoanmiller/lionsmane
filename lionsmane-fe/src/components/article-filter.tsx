import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArticleFilterStore } from '@/stores/articleFilter.store';


export function ArticleFilterSelect() {
  const setUnread = useArticleFilterStore((state) => state.setToUnread);
  const setStarred = useArticleFilterStore((state) => state.setToStarred);
  const setRead = useArticleFilterStore((state) => state.setToRead);
  const setAll = useArticleFilterStore((state) => state.setToAll);

  return (
    <Select
      onValueChange={(value) => {
        if (value === 'unread') {
          setUnread();
        } else if (value === 'read') {
          setRead();
        } else if (value === 'starred') {
          setStarred();
        } else if (value === 'all') {
          setAll();
        }
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unread">Unread</SelectItem>
        <SelectItem value="read">Read</SelectItem>
        <SelectItem value="starred">Starred</SelectItem>
        <SelectItem value="all">All</SelectItem>
      </SelectContent>
    </Select>
  );
}
