'use client';

import { Link } from '@tanstack/react-router';
import { ChevronRightIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    id: string;
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    items?:
      | {
          id: string;
          title: string;
          url: string;
          icon?: React.ReactNode;
          isActive?: boolean;
        }[]
      | undefined;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Feeds</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultExpanded={item.isActive}
            className="group/collapsible"
            render={(props) => <SidebarMenuItem {...props} />}
          >
            {item.items ? (
              <>
                <SidebarMenuButton slot="trigger" tooltip={item.title}>
                  {item.icon}
                  <span>{item.title}</span>
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-expanded/collapsible:rotate-90" />
                </SidebarMenuButton>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton href={subItem.url}>
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : (
              <>
                <SidebarMenuButton slot="trigger" tooltip={item.title}>
                  {item.icon}
                  <Link
                    to="/dash/feed/$id"
                    params={{
                      id: item.id,
                    }}
                  >
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </>
            )}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
