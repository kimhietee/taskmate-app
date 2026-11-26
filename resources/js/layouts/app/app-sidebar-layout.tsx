import { AppContent } from "@/components/app-content";
import { AppShell } from "@/components/app-shell";
import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarHeader } from "@/components/app-sidebar-header";
import type { AppLayoutProps } from "@/types";
import PrototypeBanner from "@/components/prototype-banner";

export default function AppSidebarLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <>
            <PrototypeBanner />
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} showAppearance />
                    {children}
                </AppContent>
            </AppShell>
        </>
    );
}
