import { Form, Head, usePage } from '@inertiajs/react';
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
        email: string;
        idNumber?: string | null;
        name: string;
        affiliation?: string | null;
        organizationName?: string | null;
        position?: string | null;
        supportingInfo?: string | null;
    };
};

export default function Profile() {
    const { auth, accountDetails } = usePage<PageProps>().props;
    const isOrganization = auth.user.user_type === 'organization';

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
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={accountDetails.name}
                                    required
                                    autoComplete="name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    defaultValue={accountDetails.email}
                                    autoComplete="username"
                                />
                                <InputError message={errors.email} />
                                {accountDetails.idNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        ID number: {accountDetails.idNumber}
                                    </p>
                                )}
                            </div>

                            {isOrganization ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="organization_name">
                                            Organization name
                                        </Label>
                                        <Input
                                            id="organization_name"
                                            name="organization_name"
                                            defaultValue={
                                                accountDetails.organizationName ??
                                                ''
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.organization_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="position">
                                            Your position
                                        </Label>
                                        <Input
                                            id="position"
                                            name="position"
                                            defaultValue={
                                                accountDetails.position ?? ''
                                            }
                                            required
                                        />
                                        <InputError message={errors.position} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="supporting_info">
                                            About the organization and why it
                                            posts tasks
                                        </Label>
                                        <Textarea
                                            id="supporting_info"
                                            name="supporting_info"
                                            defaultValue={
                                                accountDetails.supportingInfo ??
                                                ''
                                            }
                                            maxLength={1000}
                                            required
                                        />
                                        <InputError
                                            message={errors.supporting_info}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="affiliation">
                                        {auth.user.user_type === 'student'
                                            ? 'College and program'
                                            : 'College or office'}
                                    </Label>
                                    <Input
                                        id="affiliation"
                                        name="affiliation"
                                        defaultValue={
                                            accountDetails.affiliation ?? ''
                                        }
                                        required
                                    />
                                    <InputError message={errors.affiliation} />
                                </div>
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
