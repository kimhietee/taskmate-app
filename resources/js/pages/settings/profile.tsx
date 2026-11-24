import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
    accountDetails: {
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

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and account details"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" name="email" autoComplete="username" placeholder="Leave blank to keep your current email" />
                                <InputError message={errors.email} />
                            </div>

                            {isOrganization ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="organization_name">Organization name</Label>
                                        <Input id="organization_name" name="organization_name" defaultValue={accountDetails.organizationName ?? ''} required />
                                        <InputError message={errors.organization_name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="position">Your position</Label>
                                        <Input id="position" name="position" defaultValue={accountDetails.position ?? ''} required />
                                        <InputError message={errors.position} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="supporting_info">About the organization and why it posts tasks</Label>
                                        <Textarea id="supporting_info" name="supporting_info" defaultValue={accountDetails.supportingInfo ?? ''} maxLength={1000} required />
                                        <InputError message={errors.supporting_info} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="affiliation">{auth.user.user_type === 'student' ? 'College and program' : 'College or office'}</Label>
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
                                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground">
                                            <p><strong className="text-foreground">Student ID number (private):</strong> {accountDetails.idNumber || 'Not submitted yet'}</p>
                                            {accountDetails.institutionalEmail && (
                                                <p><strong className="text-foreground">Verified CMU email (private):</strong> {accountDetails.institutionalEmail}</p>
                                            )}
                                            {auth.user.verification_status !== 'verified' && (
                                                <p>
                                                    <Link href="/verification/student" className="font-medium text-foreground underline underline-offset-4">
                                                        Verify as CMU Student
                                                    </Link>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}


                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

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
