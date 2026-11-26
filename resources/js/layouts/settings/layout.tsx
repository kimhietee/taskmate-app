import { Link } from "@inertiajs/react";
import { Info, ShieldCheck, Sun, UserRound } from "lucide-react";
import type { PropsWithChildren } from "react";
import Heading from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { cn, toUrl } from "@/lib/utils";
import { edit as editAppearance } from "@/routes/appearance";
import { edit } from "@/routes/profile";
import { edit as editSecurity } from "@/routes/security";
import type { NavItem } from "@/types";

const sidebarNavItems: NavItem[] = [
    {
        title: "Profile",
        href: edit(),
        icon: UserRound,
    },
    {
        title: "Security",
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: "Appearance",
        href: editAppearance(),
        icon: Sun,
    },
    {
        title: "About TaskMate",
        href: "/how-it-works",
        icon: Info,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isAboutPage = isCurrentOrParentUrl("/how-it-works");

    return (
        <div className="settings-layout px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <Heading title="Settings" />
                    <nav className="flex flex-col space-y-1 space-x-0" aria-label="Settings">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn("w-full justify-start", {
                                    "bg-muted": isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className={cn("flex-1", isAboutPage ? "min-w-0" : "md:max-w-2xl")}>
                    <section
                        className={cn(
                            isAboutPage
                                ? "min-w-0"
                                : "max-w-xl space-y-12 rounded-xl border bg-card p-4 sm:p-6",
                        )}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
