import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <AppLogoIcon className="size-8 shrink-0" alt="" />
            <span className="min-w-0 flex-1 truncate text-left text-lg font-bold tracking-tight">
                {name}
            </span>
        </>
    );
}
