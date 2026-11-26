type AdminPageHeadingProps = {
    eyebrow: string;
    title: string;
    description: string;
    count?: number;
    countLabel?: string;
    action?: React.ReactNode;
};

export function AdminPageHeading({
    eyebrow,
    title,
    description,
    count,
    countLabel = 'records',
    action,
}: AdminPageHeadingProps) {
    return (
        <header className="admin-page-heading">
            <div className="min-w-0">
                <p className="admin-page-eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                <p className="admin-page-description">{description}</p>
            </div>
            {(count !== undefined || action) && (
                <div className="admin-page-heading-aside">
                    {count !== undefined && (
                        <p className="admin-page-count">
                            <strong>{count}</strong>
                            <span>{countLabel}</span>
                        </p>
                    )}
                    {action}
                </div>
            )}
        </header>
    );
}
