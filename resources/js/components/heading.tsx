export default function Heading({
    title,
    description,
    variant = 'default',
    as = 'h2',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    as?: 'h1' | 'h2' | 'h3';
}) {
    const Tag = as;
    const titleClass =
        variant === 'small'
            ? 'mb-0.5 text-base font-semibold'
            : as === 'h1'
                ? 'text-2xl font-semibold tracking-tight md:text-3xl'
                : 'text-xl font-semibold';

    return (
        <header className={variant === 'small' ? '' : 'space-y-1'}>
            <Tag className={titleClass}>{title}</Tag>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
        </header>
    );
}
