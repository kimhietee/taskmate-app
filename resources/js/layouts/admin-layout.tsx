import type { PropsWithChildren } from 'react';
import { AppContent } from '@/components/app-content';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import PrototypeBanner from '@/components/prototype-banner';
import SiteFooter from '@/components/site-footer';

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-svh flex-col">
            <PrototypeBanner />
            <AppShell>
                <AdminSidebar />
                <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                    <AppSidebarHeader
                        showMessages={false}
                        breadcrumbs={[{ title: 'Administration', href: '/admin' }]}
                    />
                    <div className="page-wide">{children}</div>
                    <SiteFooter />
                </AppContent>
            </AppShell>
        </div>
    );
}
