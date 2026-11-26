import { Head } from '@inertiajs/react';
import { AgreementDetails } from '@/components/agreement-details';
import AdminLayout from '@/layouts/admin-layout';

export default function AdminAgreementShow(props: {
    agreement: any;
    completionPayment: import('@/components/completion-payment-panel').CompletionPaymentData;
    notice: string;
}) {
    return (
        <>
            <Head title={`Agreement: ${props.agreement.task.title}`} />
            <AgreementDetails {...props} readOnly />
        </>
    );
}

AdminAgreementShow.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
