import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
    accountDetails: {
        firstName?: string | null;
        middleInitial?: string | null;
        lastName?: string | null;
        affiliation?: string | null;
        idNumber?: string | null;
        institutionalEmail?: string | null;
        organizationName?: string | null;
        position?: string | null;
        supportingInfo?: string | null;
    };
};

export default function Profile() {
    const { auth, accountDetails } = usePage<PageProps>().props;
    const isOrganization = auth.user.user_type === 'organization';
    const isUnverifiedStudent = auth.user.user_type === 'student' && auth.user.verification_status === 'unverified';
    const hasStructuredName = Boolean(accountDetails.firstName || accountDetails.lastName);

    return (
        <>
            <Head title="Profile settings" />

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your name and account details</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-5"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {hasStructuredName ? (
                                    <div className="grid gap-3 sm:grid-cols-12">
                                        <div className="grid gap-1.5 sm:col-span-5">
                                            <Label htmlFor="first_name">First name</Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                defaultValue={accountDetails.firstName ?? ''}
                                                required
                                                autoComplete="given-name"
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="middle_initial">M.I.</Label>
                                            <Input
                                                id="middle_initial"
                                                name="middle_initial"
                                                defaultValue={accountDetails.middleInitial ?? ''}
                                                maxLength={5}
                                                autoComplete="additional-name"
                                                placeholder="Opt."
                                            />
                                            <InputError message={errors.middle_initial} />
                                        </div>
                                        <div className="grid gap-1.5 sm:col-span-5">
                                            <Label htmlFor="last_name">Last name</Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                defaultValue={accountDetails.lastName ?? ''}
                                                required
                                                autoComplete="family-name"
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                )}

                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="username"
                                        placeholder="Leave blank to keep your current email"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank to keep your current email address.
                                    </p>
                                    <InputError message={errors.email} />
                                </div>

                                {isOrganization ? (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="organization_name">Organization name</Label>
                                            <Input
                                                id="organization_name"
                                                name="organization_name"
                                                defaultValue={accountDetails.organizationName ?? ''}
                                                required
                                            />
                                            <InputError message={errors.organization_name} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="position">Your position</Label>
                                            <Input
                                                id="position"
                                                name="position"
                                                defaultValue={accountDetails.position ?? ''}
                                                required
                                            />
                                            <InputError message={errors.position} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="supporting_info">About the organization and why it posts tasks</Label>
                                            <Textarea
                                                id="supporting_info"
                                                name="supporting_info"
                                                defaultValue={accountDetails.supportingInfo ?? ''}
                                                maxLength={1000}
                                                required
                                            />
                                            <InputError message={errors.supporting_info} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="affiliation">
                                                {auth.user.user_type === 'student' ? 'College and program' : 'College or office'}
                                            </Label>
                                            <Input
                                                id="affiliation"
                                                name="affiliation"
                                                defaultValue={accountDetails.affiliation ?? ''}
                                                required={!isUnverifiedStudent}
                                                placeholder={isUnverifiedStudent ? 'Set during CMU student verification' : undefined}
                                            />
                                            <InputError message={errors.affiliation} />
                                        </div>
                                        {auth.user.user_type === 'student' && (
                                            <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                                                <p>
                                                    <strong className="text-foreground">Student ID number (private):</strong>{' '}
                                                    <span className="tabular-nums">{accountDetails.idNumber || 'Not submitted yet'}</span>
                                                </p>
                                                {accountDetails.institutionalEmail && (
                                                    <p>
                                                        <strong className="text-foreground">Verified CMU email (private):</strong>{' '}
                                                        {accountDetails.institutionalEmail}
                                                    </p>
                                                )}
                                                {auth.user.verification_status !== 'verified' && (
                                                    <p>
                                                        <Link
                                                            href="/verification/student"
                                                            className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                                        >
                                                            Verify as CMU Student
                                                        </Link>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        {processing && <Spinner />}
                                        Save
                                    </Button>
                                    {recentlySuccessful && (
                                        <span role="status" className="text-sm text-success-fg">
                                            Saved.
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
