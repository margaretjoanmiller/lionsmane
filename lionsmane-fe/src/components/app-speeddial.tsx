import { useNavigate } from '@tanstack/react-router';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialContent,
  SpeedDialItem,
  SpeedDialLabel,
  SpeedDialTrigger,
} from '@/components/ui/speed-dial';
import FluentAdd24Filled from '~icons/fluent/add-24-filled';
import MingcuteNewFolderLine from '~icons/mingcute/new-folder-line';
import MingcuteRss2Fill from '~icons/mingcute/rss-2-fill';

export function AppSpeedDial() {
  const navigate = useNavigate();

  return (
    <SpeedDial>
      <SpeedDialTrigger className="transition-transform duration-200 ease-out data-[state=closed]:rotate-0 data-[state=open]:rotate-135">
        <FluentAdd24Filled />
      </SpeedDialTrigger>
      <SpeedDialContent>
        <SpeedDialItem>
          <SpeedDialLabel>Add new feed</SpeedDialLabel>
          <SpeedDialAction
            onSelect={() => navigate({ to: '/dashboard/feed/new' })}
          >
            <MingcuteRss2Fill />
          </SpeedDialAction>
        </SpeedDialItem>
        <SpeedDialItem>
          <SpeedDialLabel>Add new folder</SpeedDialLabel>
          <SpeedDialAction
            onSelect={() =>
              navigate({
                search: (prev: any) => ({ ...prev, modal: 'add-folder' }),
              })
            }
          >
            <MingcuteNewFolderLine />
          </SpeedDialAction>
        </SpeedDialItem>
      </SpeedDialContent>
    </SpeedDial>
  );
}
