import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Menu } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export function AppHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    const { auth, currentTeam } = usePage().props;
    const dashboardUrl = currentTeam
        ? dashboard(currentTeam.slug)
        : '/dashboard';
    const initials = useInitials();
    return (
        <>
            <header className="flex min-h-16 items-center gap-3 border-b px-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                        <SheetHeader>
                            <SheetTitle>
                                <AppLogo />
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="mt-6">
                            <Link
                                className="flex items-center gap-2 rounded px-3 py-2 hover:bg-muted"
                                href={dashboardUrl}
                            >
                                <LayoutGrid className="size-4" />
                                Dashboard
                            </Link>
                        </nav>
                    </SheetContent>
                </Sheet>
                <Link href={dashboardUrl} className="flex items-center">
                    <AppLogo />
                </Link>
                {breadcrumbs.length > 1 && (
                    <div className="ml-4 hidden md:block">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                )}
                <div className="ml-auto">
                    {auth.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Open account menu"
                                >
                                    <Avatar>
                                        <AvatarFallback>
                                            {initials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </header>
        </>
    );
}
