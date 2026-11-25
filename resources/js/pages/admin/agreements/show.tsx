import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { AgreementDetails } from '@/components/agreement-details';
import type { CompletionPaymentData } from '@/components/completion-payment-panel';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import admin from '@/routes/admin';

export default function AdminAgreementShow(props: {
    agreement: any;
    completionPayment: CompletionPaymentData;
    notice: string;
}) {
    return (
        <>
            <Head title={`Agreement: ${props.agreement.task.title}`} />
            <Button variant="ghost" size="sm" asChild className="-ml-2 print:hidden">
                <Link href={admin.tasks.index()}>
                    <ArrowLeft aria-hidden="true" />
                    Back to tasks
                </Link>
            </Button>
            <AgreementDetails {...props} readOnly />
        </>
    );
}

AdminAgreementShow.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
