import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { SafetyNotice } from '@/components/safety-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import verificationDetails from '@/routes/verification/details';

type UserDetails = {
    userType: 'student' | 'faculty_staff' | 'organization';
    idNumber?: string | null;
    affiliation?: string | null;
    organizationName?: string | null;
    position?: string | null;
    supportingInfo?: string | null;
};

export default function VerificationDetails({
    user,
    verificationStatus,
    verificationNote,
}: {
    user: UserDetails;
    verificationStatus: 'rejected' | 'more_info_requested';
    verificationNote: string | null;
}) {
    const isOrganization = user.userType === 'organization';

    return (
        <>
            <Head title="Update verification details" />
            <main className="verification-details-page">
                <header className="verification-page-hero">
                    <VerificationStatusBadge status={verificationStatus} />
                    <p className="verification-page-eyebrow">Account verification</p>
                    <h1>
                        Update your submitted details
                    </h1>
                    <p className="verification-page-description">
                        Update only the information requested for review. Your
                        account type and email cannot be changed here.
                        Submitting returns your account to pending review.
                    </p>
                </header>
                {verificationNote && (
                    <div className="verification-admin-note">
                        <p className="font-medium">Administrator note</p>
                        <p className="mt-2 whitespace-pre-wrap">
                            {verificationNote}
                        </p>
                    </div>
                )}
                <SafetyNotice />

                <Form
                    {...verificationDetails.update.form()}
                    className="verification-details-form"
                >
                    {({ processing, errors }) => (
                        <>
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
                                                user.organizationName ?? ''
                                            }
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This is the organization’s display
                                            name on TaskMate.
                                        </p>
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
                                            defaultValue={user.position ?? ''}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Used by administrators to review
                                            this account.
                                        </p>
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
                                                user.supportingInfo ?? ''
                                            }
                                            maxLength={1000}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This description is for
                                            administrator review and is not
                                            shown on public profiles.
                                        </p>
                                        <InputError
                                            message={errors.supporting_info}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="id_number">
                                            {user.userType === 'student'
                                                ? 'Student ID number'
                                                : 'Employee ID number'}
                                        </Label>
                                        <Input
                                            id="id_number"
                                            name="id_number"
                                            defaultValue={user.idNumber ?? ''}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Used for account review. Your ID
                                            number is visible only to you and
                                            administrators.
                                        </p>
                                        <InputError
                                            message={errors.id_number}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="affiliation">
                                            {user.userType === 'student'
                                                ? 'College and program'
                                                : 'College or office'}
                                        </Label>
                                        <Input
                                            id="affiliation"
                                            name="affiliation"
                                            defaultValue={
                                                user.affiliation ?? ''
                                            }
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Helps other users understand your
                                            campus affiliation and may appear on
                                            your profile.
                                        </p>
                                        <InputError
                                            message={errors.affiliation}
                                        />
                                    </div>
                                </>
                            )}
                            <Button disabled={processing}>
                                Submit for review
                            </Button>
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}
