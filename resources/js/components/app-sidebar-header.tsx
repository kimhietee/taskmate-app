import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppearance } from "@/hooks/use-appearance";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types";
import { NotificationBell } from "@/components/notification-bell";
import { router, usePage } from "@inertiajs/react";
import { ArrowLeft, Moon, Sun } from "lucide-react";

function AppearanceIconButton() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const nextAppearance = resolvedAppearance === "dark" ? "light" : "dark";

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label={`Switch to ${nextAppearance} mode`}
            title={`Switch to ${nextAppearance} mode`}
            onClick={() => updateAppearance(nextAppearance)}
        >
            {resolvedAppearance === "dark" ? (
                <Sun className="size-5" aria-hidden="true" />
            ) : (
                <Moon className="size-5" aria-hidden="true" />
            )}
        </Button>
    );
}

export function AppSidebarHeader({
    breadcrumbs = [],
    showMessages = true,
    showBack = false,
    showAppearance = false,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    showMessages?: boolean;
    showBack?: boolean;
    showAppearance?: boolean;
}) {
    const page = usePage();
    const currentPath = page.url.split('?')[0];
    const stickNavigation =
        currentPath === '/my-tasks' || /^\/tasks\/\d+$/.test(currentPath);
    const pollSeconds =
        (page.props as { notificationPollSeconds?: number }).notificationPollSeconds ?? 10;
    const goBack = () => {
        if (page.url === "/admin") {
            router.visit("/dashboard");
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit("/admin");
        }
    };

    return (
        <header
            className={`flex h-16 shrink-0 items-center gap-2 border-b bg-card px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 ${stickNavigation ? 'sticky top-0 z-40' : ''}`}
        >
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                {showBack && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        aria-label="Go back"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                )}
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-1">
                <NotificationBell pollSeconds={pollSeconds} showMessages={showMessages} />
                {showAppearance && <AppearanceIconButton />}
            </div>
        </header>
    );
}
