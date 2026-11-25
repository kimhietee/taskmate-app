import type { PropsWithChildren } from 'react';
import PrototypeBanner from '@/components/prototype-banner';
import SiteFooter from '@/components/site-footer';

// Public shell: banner, page content, footer. The footer is pushed to the bottom with mt-auto.
export default function PublicLayout({ children }: PropsWithChildren) {
    return <div className="flex min-h-svh flex-col bg-background text-foreground"><PrototypeBanner /><main className="flex-1">{children}</main><SiteFooter /></div>;
}
