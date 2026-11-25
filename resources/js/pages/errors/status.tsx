import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const messages: Record<number, string> = {
    403: 'You do not have permission to view this page.',
    404: 'We could not find that page.',
    419: 'This page expired. Refresh it and try again.',
    429: 'Too many requests. Please wait before trying again.',
    500: 'Something went wrong. Please try again later.',
};

export default function ErrorStatus({ status }: { status: number }) {
    const { auth } = usePage<{ auth?: { user?: unknown } }>().props;
    const user = auth?.user;

    return (
        <>
            <Head title={`Error ${status}`} />
            <div className="page-narrow flex min-h-[65vh] items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="space-y-4 pt-2">
                        <Badge variant="neutral" className="mx-auto tabular-nums">
                            Error {status}
                        </Badge>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            {messages[status] ?? messages[500]}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            You can return to the TaskMate home page or continue to your dashboard.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <Button asChild>
                                <Link href={user ? '/dashboard' : '/'}>
                                    {user ? 'Go to dashboard' : 'Back to home'}
                                </Link>
                            </Button>
                            {user ? (
                                <Button variant="outline" asChild>
                                    <Link href="/">Back to home</Link>
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
