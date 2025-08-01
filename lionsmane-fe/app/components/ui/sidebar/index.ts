/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import { cva } from "class-variance-authority";

export interface SidebarProps {
	side?: "left" | "right";
	variant?: "sidebar" | "floating" | "inset";
	collapsible?: "offcanvas" | "icon" | "none";
	class?: HTMLAttributes["class"];
	refresh?: Promise<void>;
}

export { default as Sidebar } from "../../../components/ui/sidebar/Sidebar.vue";
export { default as SidebarContent } from "../../../components/ui/sidebar/SidebarContent.vue";
export { default as SidebarFooter } from "../../../components/ui/sidebar/SidebarFooter.vue";
export { default as SidebarGroup } from "../../../components/ui/sidebar/SidebarGroup.vue";
export { default as SidebarGroupAction } from "../../../components/ui/sidebar/SidebarGroupAction.vue";
export { default as SidebarGroupContent } from "../../../components/ui/sidebar/SidebarGroupContent.vue";
export { default as SidebarGroupLabel } from "../../../components/ui/sidebar/SidebarGroupLabel.vue";
export { default as SidebarHeader } from "../../../components/ui/sidebar/SidebarHeader.vue";
export { default as SidebarInput } from "../../../components/ui/sidebar/SidebarInput.vue";
export { default as SidebarInset } from "../../../components/ui/sidebar/SidebarInset.vue";
export { default as SidebarMenu } from "../../../components/ui/sidebar/SidebarMenu.vue";
export { default as SidebarMenuAction } from "../../../components/ui/sidebar/SidebarMenuAction.vue";
export { default as SidebarMenuBadge } from "../../../components/ui/sidebar/SidebarMenuBadge.vue";
export { default as SidebarMenuButton } from "../../../components/ui/sidebar/SidebarMenuButton.vue";
export { default as SidebarMenuItem } from "../../../components/ui/sidebar/SidebarMenuItem.vue";
export { default as SidebarMenuSkeleton } from "../../../components/ui/sidebar/SidebarMenuSkeleton.vue";
export { default as SidebarMenuSub } from "../../../components/ui/sidebar/SidebarMenuSub.vue";
export { default as SidebarMenuSubButton } from "../../../components/ui/sidebar/SidebarMenuSubButton.vue";
export { default as SidebarMenuSubItem } from "../../../components/ui/sidebar/SidebarMenuSubItem.vue";
export { default as SidebarProvider } from "../../../components/ui/sidebar/SidebarProvider.vue";
export { default as SidebarRail } from "../../../components/ui/sidebar/SidebarRail.vue";
export { default as SidebarSeparator } from "../../../components/ui/sidebar/SidebarSeparator.vue";
export { default as SidebarTrigger } from "../../../components/ui/sidebar/SidebarTrigger.vue";

export { useSidebar } from "./utils";

export const sidebarMenuButtonVariants = cva(
	"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				outline:
					"bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
			},
			size: {
				default: "h-8 text-sm",
				sm: "h-7 text-xs",
				lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type SidebarMenuButtonVariants = VariantProps<
	typeof sidebarMenuButtonVariants
>;
