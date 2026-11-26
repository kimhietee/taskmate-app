import { Link } from '@inertiajs/react';
import { PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE } from '@/constants/notices';

const links = [
    ['/how-it-works', 'How TaskMate works'],
    ['/task-guidelines', 'Task Guidelines'],
    ['/safety-and-limits', 'Safety and Limits'],
    ['/privacy', 'Privacy Notice'],
] as const;

export default function SiteFooter() {
    return (
        <footer className="taskmate-footer">
            <div className="taskmate-footer-inner">
                <nav aria-label="Information" className="taskmate-footer-links">
                    {links.map(([href, label]) => (
                        <Link key={href} href={href}>
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="taskmate-footer-notices">
                    <div className="taskmate-footer-notice taskmate-footer-notice--payment">
                        <strong>Payment</strong>
                        <p>{PAYMENT_BOUNDARY_NOTICE}</p>
                    </div>
                    <div className="taskmate-footer-notice taskmate-footer-notice--safety">
                        <strong>Safety</strong>
                        <p>{SAFETY_NOTICE}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
