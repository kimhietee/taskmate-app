import { Form } from '@inertiajs/react';
import { ChevronDown, Flag } from 'lucide-react';
import { useId } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type Option = { value: string; label: string };

type Props = {
    action: string;
    types: Option[];
    reportLabel?: string;
    maxLength?: number;
    contextMessages?: number;
};

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

export function ProblemReportForm({
    action,
    types,
    reportLabel = 'Report a problem',
    maxLength = 3000,
    contextMessages,
}: Props) {
    const fieldId = useId();
    const typeId = `${fieldId}-type`;
    const descriptionId = `${fieldId}-description`;
    const evidenceId = `${fieldId}-evidence`;

    return (
        <details className="group rounded-xl border border-border bg-card p-4 shadow-xs">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-semibold text-foreground md:min-h-8 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                    <Flag className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span>{reportLabel}</span>
                </span>
                <ChevronDown
                    className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                />
            </summary>

            <Form
                action={action}
                method="post"
                encType="multipart/form-data"
                className="mt-4 space-y-4 border-t border-border pt-4"
            >
                {({ errors, processing }) => {
                    const errorRecord = errors as Record<string, string | undefined>;

                    return (
                        <>
                            {contextMessages !== undefined && (
                                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                    This message and up to {contextMessages} messages before and after it will be
                                    shared with administrators.
                                </p>
                            )}

                            <div className="grid gap-1.5">
                                <Label htmlFor={typeId}>Report type</Label>
                                <select id={typeId} name="type" required className={NATIVE_SELECT_CLASS}>
                                    {types.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errorRecord.type} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor={descriptionId}>What happened?</Label>
                                <Textarea
                                    id={descriptionId}
                                    name="description"
                                    required
                                    maxLength={maxLength}
                                    className="min-h-28"
                                />
                                <InputError message={errorRecord.description} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor={evidenceId}>Evidence (optional)</Label>
                                <Input
                                    id={evidenceId}
                                    name="evidence[]"
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-foreground"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Do not upload government ID photos, selfies, or sensitive documents beyond what is
                                    needed. Administrators will see uploaded evidence.
                                </p>
                                <InputError message={errorRecord.evidence ?? errorRecord['evidence.0']} />
                            </div>

                            <div>
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    {processing && <Spinner />}
                                    {processing ? 'Submitting report...' : 'Submit report'}
                                </Button>
                            </div>
                        </>
                    );
                }}
            </Form>
        </details>
    );
}
