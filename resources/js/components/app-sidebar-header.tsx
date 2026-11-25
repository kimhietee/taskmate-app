import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { NotificationBell } from '@/components/notification-bell';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({
    breadcrumbs = [],
    showMessages = true,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    showMessages?: boolean;
}) {
    const pollSeconds = (usePage().props as { notificationPollSeconds?: number }).notificationPollSeconds ?? 10;
    return (
        <header className="bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-[var(--banner-h,0px)] z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur transition-[width,height] ease-linear md:h-16 md:px-4 md:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto"><NotificationBell pollSeconds={pollSeconds} showMessages={showMessages} /></div>
        </header>
    );
}
