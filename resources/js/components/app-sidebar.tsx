import { Link, usePage } from '@inertiajs/react';
import { BriefcaseBusiness, FolderGit2, LayoutGrid, Plus, Search, ShieldCheck } from 'lucide-react';
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
import { dashboard } from '@/routes';
import { create as createTask, mine as myTasks } from '@/routes/tasks';
import browse from '@/routes/browse';
import applications from '@/routes/applications';
import reports from '@/routes/reports';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const dashboardUrl = page.props.currentTeam
        ? dashboard(page.props.currentTeam.slug)
        : '/dashboard';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
    ];

    if (page.props.auth.user?.can_post_tasks) {
        mainNavItems.push(
            { title: 'Post a Task', href: createTask().url, icon: Plus },
            { title: 'My Tasks', href: myTasks().url, icon: BriefcaseBusiness },
        );
    }
    if (page.props.auth.user?.can_browse_tasks || page.props.auth.user?.can_apply_tasks) {
        mainNavItems.push({ title: 'Browse Tasks', href: browse.index().url, icon: Search });
    }
    if (page.props.auth.user?.can_apply_tasks) {
        mainNavItems.push({ title: 'My Applications', href: applications.mine().url, icon: BriefcaseBusiness });
    }
    if (page.props.auth.user?.can_request_student_verification) {
        mainNavItems.push({ title: 'Verify Student Status', href: '/verification/student', icon: ShieldCheck });
    }
    if (page.props.auth.user?.verification_status === 'verified') {
        mainNavItems.push({ title: 'My Reports', href: reports.mine().url, icon: FolderGit2 });
    }


    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
