import type { PropsWithChildren } from 'react';
import { AppContent } from '@/components/app-content';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import PrototypeBanner from '@/components/prototype-banner';

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <>
            <PrototypeBanner />
            <AppShell>
                <AdminSidebar />
                <AppContent
                    variant="sidebar"
                    className="min-w-0 overflow-x-clip"
                >
                    <AppSidebarHeader
                        showMessages={false}
                        showBack
                        showAppearance
                        breadcrumbs={[
                            { title: 'Administration', href: '/admin' },
                        ]}
                    />
                    <div className="mx-auto w-full max-w-6xl px-4 py-6">
                        {children}
                    </div>
                </AppContent>
            </AppShell>
        </>
    );
}
