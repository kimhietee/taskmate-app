import { useState } from 'react';
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

type AffiliationOptions = { student: string[]; faculty_staff: string[] };

const OTHER_VALUE = '__other__';

export default function VerificationDetails({
    user,
    verificationStatus,
    verificationNote,
    affiliationOptions = { student: [], faculty_staff: [] },
}: {
    user: UserDetails;
    verificationStatus: 'rejected' | 'more_info_requested';
    verificationNote: string | null;
    affiliationOptions?: AffiliationOptions;
}) {
    const isOrganization = user.userType === 'organization';
    const presets = user.userType === 'student' ? affiliationOptions.student : affiliationOptions.faculty_staff;
    const savedAffiliation = user.affiliation ?? '';
    const initialInPresets = presets.includes(savedAffiliation);
    const [selectedAffiliation, setSelectedAffiliation] = useState(
        presets.length > 0 ? (initialInPresets ? savedAffiliation : savedAffiliation ? OTHER_VALUE : '') : '',
    );
    const [customAffiliation, setCustomAffiliation] = useState(initialInPresets ? '' : savedAffiliation);
    const resolvedAffiliation = presets.length > 0
        ? (selectedAffiliation === OTHER_VALUE ? customAffiliation : selectedAffiliation)
        : customAffiliation;

    return (
        <>
            <Head title="Update verification details" />
            <div className="mx-auto max-w-2xl space-y-6 p-4">
                <div className="space-y-2">
                    <VerificationStatusBadge status={verificationStatus} />
                    <h1 className="text-2xl font-semibold">Update your submitted details</h1>
                    <p className="text-sm text-muted-foreground">Update only the information requested for review. Your account type and email cannot be changed here. Submitting returns your account to pending review.</p>
                </div>
                {verificationNote && <div className="rounded-lg border p-4 text-sm"><p className="font-medium">Administrator note</p><p className="mt-2 whitespace-pre-wrap">{verificationNote}</p></div>}
                <SafetyNotice />

                <Form {...verificationDetails.update.form()} className="space-y-5">
                    {({ processing, errors }) => (
                        <>
                            {isOrganization ? (
                                <>
                                    <div className="grid gap-2"><Label htmlFor="organization_name">Organization name</Label><Input id="organization_name" name="organization_name" defaultValue={user.organizationName ?? ''} required /><p className="text-xs text-muted-foreground">This is the organization’s display name on TaskMate.</p><InputError message={errors.organization_name} /></div>
                                    <div className="grid gap-2"><Label htmlFor="position">Your position</Label><Input id="position" name="position" defaultValue={user.position ?? ''} required /><p className="text-xs text-muted-foreground">Used by administrators to review this account.</p><InputError message={errors.position} /></div>
                                    <div className="grid gap-2"><Label htmlFor="supporting_info">About the organization and why it posts tasks</Label><Textarea id="supporting_info" name="supporting_info" defaultValue={user.supportingInfo ?? ''} maxLength={1000} required /><p className="text-xs text-muted-foreground">This description is for administrator review and is not shown on public profiles.</p><InputError message={errors.supporting_info} /></div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2"><Label htmlFor="id_number">{user.userType === 'student' ? 'Student ID number' : 'Employee ID number'}</Label><Input id="id_number" name="id_number" defaultValue={user.idNumber ?? ''} required /><p className="text-xs text-muted-foreground">Used for account review. Your ID number is visible only to you and administrators.</p><InputError message={errors.id_number} /></div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={presets.length > 0 ? 'affiliation_select' : 'affiliation'}>{user.userType === 'student' ? 'College and program' : 'College or office'}</Label>
                                        {presets.length > 0 ? (
                                            <>
                                                <input type="hidden" name="affiliation" value={resolvedAffiliation} />
                                                <select
                                                    id="affiliation_select"
                                                    value={selectedAffiliation}
                                                    onChange={(event) => setSelectedAffiliation(event.target.value)}
                                                    required
                                                    className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm"
                                                >
                                                    <option value="" disabled>Select affiliation</option>
                                                    {presets.map((item) => <option key={item} value={item}>{item}</option>)}
                                                    <option value={OTHER_VALUE}>Other (specify below)</option>
                                                </select>
                                                {selectedAffiliation === OTHER_VALUE && (
                                                    <Input
                                                        id="affiliation_custom"
                                                        value={customAffiliation}
                                                        onChange={(event) => setCustomAffiliation(event.target.value)}
                                                        required
                                                        placeholder="Enter your college, program, or office"
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <Input id="affiliation" name="affiliation" value={customAffiliation} onChange={(event) => setCustomAffiliation(event.target.value)} required />
                                        )}
                                        <p className="text-xs text-muted-foreground">Helps other users understand your campus affiliation and may appear on your profile.</p>
                                        <InputError message={errors.affiliation} />
                                    </div>
                                </>
                            )}
                            <Button disabled={processing}>Submit for review</Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
