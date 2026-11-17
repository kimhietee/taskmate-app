import { formatDate, formatAmount } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import applicationsRoutes from '@/routes/applications';
import browseRoutes from '@/routes/browse';
import agreementsRoutes from '@/routes/agreements';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { useReducedMotion, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

type Item = { id: number; taskId: number; taskTitle: string; posterName: string; budget: string; status: string; statusLabel: string; taskStatus: string; taskApproved: boolean; agreementId: number | null; agreementStatus: string | null; agreementStatusLabel: string | null; paymentStatus: string | null; paymentStatusLabel: string | null; appliedAt: string | null; needsRating: boolean };
type Props = { applications: { data: Item[]; links: { url: string | null; label: string; active: boolean }[] }; status?: string | null };

function AnimatedApplicationAction({ href, label, typingDelay = 0, primary = false }: { href: string; label: string; typingDelay?: number; primary?: boolean }) {
    const reduceMotion = useReducedMotion();
    const [typedLabel, setTypedLabel] = useState(label);

    useEffect(() => {
        if (reduceMotion) {
            setTypedLabel(label);
            return;
        }

        setTypedLabel('');
        let character = 0;
        let interval: number | undefined;
        const start = window.setTimeout(() => {
            interval = window.setInterval(() => {
                character += 1;
                setTypedLabel(label.slice(0, character));
                if (character >= label.length && interval !== undefined) window.clearInterval(interval);
            }, 38);
        }, typingDelay);

        return () => {
            window.clearTimeout(start);
            if (interval !== undefined) window.clearInterval(interval);
        };
    }, [label, reduceMotion, typingDelay]);

    return <motion.div
        animate={reduceMotion ? undefined : { y: [0, -1.5, 0] }}
        transition={reduceMotion ? undefined : { duration: 3.2, ease: 'easeInOut', repeat: Infinity, delay: typingDelay / 1000 }}
        whileHover={reduceMotion ? undefined : { y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        className="inline-flex"
    >
        <Button className={`min-h-11 rounded-lg px-4 ${primary ? 'bg-[#065F46] text-white hover:bg-[#064E3B] dark:bg-amber-300 dark:text-[#183324] dark:hover:bg-amber-200' : 'border-[#d8e2d9] bg-white text-[#183324] hover:border-[#065F46] hover:bg-[#f5f8f2] dark:border-[#31483a] dark:bg-[#17251c] dark:text-[#EDF4EC] dark:hover:bg-[#203329]'}`} variant={primary ? 'default' : 'outline'} asChild>
            <Link href={href} aria-label={label}>
                <span aria-hidden="true" className={typedLabel.length < label.length ? 'border-r border-current pr-0.5' : ''}>{reduceMotion ? label : typedLabel}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
        </Button>
    </motion.div>;
}

export default function MyApplications({ applications, status }: Props) {
    return <><Head title="My applications" /><div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"><div><h1 className="text-2xl font-semibold">My applications</h1><p className="mt-1 text-sm text-muted-foreground">Track responses to tasks you applied for.</p></div>{status && <div role="status" className="rounded-lg border px-4 py-3 text-sm">{status}</div>}{applications.data.length ? <div className="grid gap-4 md:grid-cols-2">{applications.data.map((application) => <article key={application.id} className="flex h-full flex-col gap-3 rounded-2xl border border-[#dce8dd] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c]"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold tracking-tight">{application.taskTitle}</h2><ApplicationStatusBadge status={application.status} label={application.statusLabel} /></div><p className="text-sm text-muted-foreground">Poster: {application.posterName}</p><p className="text-sm font-medium">Budget: ₱{formatAmount(application.budget)}</p><p className="text-xs text-muted-foreground">Applied {application.appliedAt ? formatDate(application.appliedAt) : '—'}</p>{application.status === 'accepted' && <p className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">{application.agreementId ? (application.agreementStatus === 'agreed' ? 'Agreement locked.' : `Agreement ${application.agreementStatusLabel?.toLowerCase() ?? 'pending'}.`) : 'Accepted. The poster will propose an agreement before work begins.'}</p>}{application.paymentStatus && application.paymentStatusLabel && <PaymentStatusBadge status={application.paymentStatus} label={application.paymentStatusLabel} />}{application.needsRating && application.agreementId && <Button size="sm" variant="outline" asChild><Link href={agreementsRoutes.rate(application.agreementId)}>Rate your experience</Link></Button>}{!application.taskApproved && <p className="text-sm text-muted-foreground">Task status: {application.taskStatus}</p>}<div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4"><AnimatedApplicationAction href={applicationsRoutes.task(application.id).url} label="Task details" /><div className="[&+div]:delay-200">{application.agreementId && <AnimatedApplicationAction href={agreementsRoutes.show(application.agreementId).url} label="Agreement" typingDelay={500} primary />}</div>{application.status === 'pending' && <Form {...applicationsRoutes.withdraw.form(application.id)} onSubmit={(event) => { if (!window.confirm('Withdraw this application?')) event.preventDefault(); }}><Button className="min-h-11 rounded-lg px-4" size="sm" variant="outline" type="submit">Withdraw</Button></Form>}</div></article>)}</div> : <div className="rounded-xl border p-8 text-center"><h2 className="font-semibold">You have not applied to any tasks</h2><p className="mt-2 text-sm text-muted-foreground">Browse approved tasks to find work that suits you.</p><Button className="mt-4" asChild><Link href={browseRoutes.index()}>Browse tasks</Link></Button></div>}{applications.links.length > 3 && <nav className="flex flex-wrap gap-2" aria-label="Pagination">{applications.links.map((link, index) => link.url ? <Link key={index} href={link.url} className={`rounded border px-3 py-1 text-sm ${link.active ? 'bg-muted font-medium' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} className="rounded border px-3 py-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}</div></>;
}
