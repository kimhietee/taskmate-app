import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';

type Option = { value: string; label: string };

export function ProblemReportForm({
    action,
    types,
    reportLabel = 'Report a problem',
    maxLength = 3000,
    contextMessages,
}: {
    action: string;
    types: Option[];
    reportLabel?: string;
    maxLength?: number;
    contextMessages?: number;
}) {
    return (
        <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">
                {reportLabel}
            </summary>
            <Form
                action={action}
                method="post"
                encType="multipart/form-data"
                className="mt-4 space-y-3"
            >
                {({ errors, processing }) => (
                    <>
                        {contextMessages !== undefined && (
                            <p className="rounded border bg-muted p-3 text-sm">
                                This message and up to {contextMessages}{' '}
                                messages before and after it will be shared with
                                administrators.
                            </p>
                        )}
                        <label className="block text-sm">
                            Report type
                            <select
                                name="type"
                                required
                                className="mt-1 h-10 w-full rounded border bg-background px-3"
                            >
                                {types.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm">
                            What happened?
                            <textarea
                                name="description"
                                required
                                maxLength={maxLength}
                                className="mt-1 min-h-28 w-full rounded border bg-background p-3"
                            />
                        </label>
                        <InputError message={errors.description} />
                        <label className="block text-sm">
                            Evidence (optional)
                            <input
                                name="evidence[]"
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="mt-1 block w-full text-sm"
                            />
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Do not upload government ID photos, selfies, or
                            sensitive documents beyond what is needed.
                            Administrators will see uploaded evidence.
                        </p>
                        <Button type="submit" disabled={processing}>
                            Submit report
                        </Button>
                    </>
                )}
            </Form>
        </details>
    );
}
