import { Link } from '@inertiajs/react';
import { BriefcaseBusiness, Flag, LayoutDashboard, ShieldCheck, Star, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import admin from '@/routes/admin';
import type { NavItem } from '@/types';

const items: NavItem[] = [
    { title: 'Dashboard', href: admin.dashboard().url, icon: LayoutDashboard },
    { title: 'Users', href: admin.users.index().url, icon: Users },
    { title: 'Tasks', href: admin.tasks.index().url, icon: BriefcaseBusiness },
    { title: 'Reports', href: admin.reports.index().url, icon: ShieldCheck },
    { title: 'Flags', href: '/admin/flags', icon: Flag },
    { title: 'Ratings', href: admin.ratings.index().url, icon: Star },
];

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border/60 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={admin.dashboard()} prefetch>
                                <AppLogo />
                                <span className="truncate text-sm font-semibold tracking-tight">Administration</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="pt-2">
                <NavMain items={items} groupLabel="Administration" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
