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
        <header className="bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-[var(--banner-h,0px)] z-30 flex min-h-14 shrink-0 items-center gap-2 border-b px-4 py-2 backdrop-blur transition-[width,height] ease-linear md:min-h-16 md:px-4 md:group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-12 print:hidden">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <div className="min-w-0 flex-1">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="ml-auto shrink-0"><NotificationBell pollSeconds={pollSeconds} showMessages={showMessages} /></div>
        </header>
    );
}
