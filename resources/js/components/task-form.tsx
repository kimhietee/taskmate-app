import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { useState } from 'react';
import { Form } from '@inertiajs/react';
import { AlertCircle, BriefcaseBusiness, ClipboardCheck, Coins, FileText, MapPin, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Option = { value: string; label: string };
type TaskData = {
    title: string; category: string; description: string; requiredActivities: string; deliverables: string;
    estimatedDurationHours: string; skillRequirements: string | null; complexity: string; budget: string;
    workModeValue: string; workplaceName: string | null; workplaceAddress: string | null; deadline: string | null;
    physicalDemand: string | null; academicInvolvement: string | null; hazardExposure: boolean; hazardDescription: string | null;
    privateMeetingRequired: boolean; workplaceSetting: string | null;
};
type Props = {
    action: { action: string; method: 'post' | 'put' };
    options: { categories: Option[]; workModes: Option[]; complexities: Option[]; guidelines: string[]; riskQuestions: { physical_demand: Option[]; academic_involvement: Option[]; workplace_setting: Option[] } };
    task: TaskData | null;
    resetWarning: boolean;
};

const fieldClass = 'min-h-11 rounded-lg border-input bg-background px-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20';
const selectClass = 'h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15';
const textAreaClass = 'min-h-28 rounded-lg border-input bg-background px-3.5 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20';
const sectionClass = 'rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7';

function SectionHeading({ icon: Icon, title, description }: { icon: typeof FileText; title: string; description: string }) {
    return <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-primary dark:bg-amber-300/15"><Icon className="size-5" aria-hidden="true" /></span>
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div>
    </div>;
}

export default function TaskForm({ action, options, task, resetWarning }: Props) {
    const [workMode, setWorkMode] = useState(task?.workModeValue ?? '');
    const [hazardExposure, setHazardExposure] = useState(task?.hazardExposure ? '1' : '0');
    const hasWorkplace = workMode === 'onsite' || workMode === 'hybrid';

    return <Form {...action} className="space-y-5">
        {({ errors, processing }) => <>
            {resetWarning && <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-300/10 dark:text-amber-100"><AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p>Saving these changes will send this task back for review and clear the previous review note.</p></div>}

            <section className={sectionClass}>
                <SectionHeading icon={FileText} title="Task details" description="Give people a clear picture of the work and what they will complete." />
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="title">Task title <span className="text-muted-foreground">(short and specific)</span></Label><Input className={fieldClass} id="title" name="title" maxLength={150} placeholder="For example, Help organize a campus event" defaultValue={task?.title} required /><InputError message={errors.title} /></div>
                    <div className="grid gap-2"><Label htmlFor="category">Category</Label><select id="category" name="category" defaultValue={task?.category ? options.categories.find((option) => option.label === task.category)?.value ?? '' : ''} className={selectClass} required><option value="" disabled>Select a category</option>{options.categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><InputError message={errors.category} /></div>
                    <div className="grid gap-2"><Label htmlFor="complexity">Experience level</Label><select id="complexity" name="complexity" defaultValue={task?.complexity ? options.complexities.find((option) => option.label === task.complexity)?.value ?? '' : ''} className={selectClass} required><option value="" disabled>Select a level</option>{options.complexities.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><InputError message={errors.complexity} /></div>
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="description">Task description</Label><Textarea className={textAreaClass} id="description" name="description" placeholder="Explain the goal, context, and any important details." defaultValue={task?.description} required /><InputError message={errors.description} /></div>
                    <div className="grid gap-2"><Label htmlFor="required_activities">What needs to be done?</Label><Textarea className={textAreaClass} id="required_activities" name="required_activities" placeholder="List the main activities or steps." defaultValue={task?.requiredActivities} required /><InputError message={errors.required_activities} /></div>
                    <div className="grid gap-2"><Label htmlFor="deliverables">Expected outcome</Label><Textarea className={textAreaClass} id="deliverables" name="deliverables" placeholder="Describe what the completed work should include." defaultValue={task?.deliverables} required /><InputError message={errors.deliverables} /></div>
                    <div className="grid gap-2"><Label htmlFor="skill_requirements">Skills or experience <span className="text-muted-foreground">(optional)</span></Label><Textarea className={textAreaClass} id="skill_requirements" name="skill_requirements" placeholder="Share any helpful skills or prior experience." defaultValue={task?.skillRequirements ?? ''} /><InputError message={errors.skill_requirements} /></div>
                    <div className="grid gap-2"><Label htmlFor="estimated_duration_hours">Estimated time</Label><div className="relative"><Input className={`${fieldClass} pr-16`} id="estimated_duration_hours" name="estimated_duration_hours" type="number" min="0.5" max="500" step="0.1" placeholder="e.g. 3" defaultValue={task?.estimatedDurationHours} required /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">hours</span></div><InputError message={errors.estimated_duration_hours} /></div>
                </div>
            </section>

            <section className={sectionClass}>
                <SectionHeading icon={MapPin} title="Work details" description="Set expectations for how and where the task will take place." />
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                    <div className="grid gap-2"><Label htmlFor="work_mode">Work mode</Label><select id="work_mode" name="work_mode" value={workMode} onChange={(event) => setWorkMode(event.target.value)} className={selectClass} required><option value="" disabled>Select a work mode</option>{options.workModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><InputError message={errors.work_mode} /></div>
                    <div className="grid gap-2"><Label htmlFor="deadline">Deadline <span className="text-muted-foreground">(optional)</span></Label><Input className={fieldClass} id="deadline" name="deadline" type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} defaultValue={task?.deadline ?? ''} /><InputError message={errors.deadline} /></div>
                    {hasWorkplace && <><div className="sm:col-span-2 rounded-xl border border-primary/15 bg-secondary/60 px-4 py-3 text-sm leading-5 text-secondary-foreground">In-person work details are shown to students before they apply. Enter a place of work, not a home address.</div><div className="grid gap-2"><Label htmlFor="workplace_name">Workplace name</Label><Input className={fieldClass} id="workplace_name" name="workplace_name" placeholder="Organization, office, or public venue" defaultValue={task?.workplaceName ?? ''} required /><InputError message={errors.workplace_name} /></div><div className="grid gap-2"><Label htmlFor="workplace_address">Workplace address</Label><Input className={fieldClass} id="workplace_address" name="workplace_address" placeholder="Specific work location" defaultValue={task?.workplaceAddress ?? ''} required /><InputError message={errors.workplace_address} /></div></>}
                </div>
            </section>

            <section className={sectionClass}>
                <SectionHeading icon={ShieldCheck} title="Safety and suitability" description="Answer these questions so applicants and reviewers can understand the work setting." />
                <p className="-mt-2 mb-5 rounded-xl border border-amber-300/70 bg-amber-100/70 px-4 py-3 text-sm leading-5 text-amber-950 dark:border-amber-800 dark:bg-amber-300/10 dark:text-amber-100">Your answers help with review and inform people's decisions. Screening cannot guarantee that a task is safe.</p>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                    <div className="grid gap-2"><Label htmlFor="physical_demand">Physical demand</Label><select id="physical_demand" name="physical_demand" defaultValue={task?.physicalDemand ?? ''} className={selectClass} required><option value="" disabled>Select an answer</option>{options.riskQuestions.physical_demand.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><InputError message={errors.physical_demand} /></div>
                    <div className="grid gap-2"><Label htmlFor="academic_involvement">Academic involvement</Label><select id="academic_involvement" name="academic_involvement" defaultValue={task?.academicInvolvement ?? ''} className={selectClass} required><option value="" disabled>Select an answer</option>{options.riskQuestions.academic_involvement.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><InputError message={errors.academic_involvement} /></div>
                    <div className="grid gap-2"><Label htmlFor="hazard_exposure">Does this task involve hazards?</Label><select id="hazard_exposure" name="hazard_exposure" value={hazardExposure} onChange={(event) => setHazardExposure(event.target.value)} className={selectClass} required><option value="0">No</option><option value="1">Yes</option></select><InputError message={errors.hazard_exposure} /></div>
                    {hazardExposure === '1' && <div className="grid gap-2 sm:col-span-2"><Label htmlFor="hazard_description">Describe the hazards</Label><Textarea className={textAreaClass} id="hazard_description" name="hazard_description" placeholder="Describe the exposure and relevant precautions." defaultValue={task?.hazardDescription ?? ''} required /><InputError message={errors.hazard_description} /></div>}
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="private_meeting_required">Does this task require a one-on-one meeting in a private or isolated place?</Label><select id="private_meeting_required" name="private_meeting_required" defaultValue={task?.privateMeetingRequired ? '1' : '0'} className={selectClass} required><option value="0">No</option><option value="1">Yes</option></select><InputError message={errors.private_meeting_required} /></div>
                    {hasWorkplace && <div className="grid gap-2"><Label htmlFor="workplace_setting">Workplace setting</Label><select id="workplace_setting" name="workplace_setting" defaultValue={task?.workplaceSetting ?? ''} className={selectClass} required><option value="" disabled>Select a setting</option>{options.riskQuestions.workplace_setting.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><InputError message={errors.workplace_setting} /></div>}
                </div>
            </section>

            <section className={sectionClass}>
                <SectionHeading icon={Coins} title="Compensation" description="Set a clear estimated budget for the work." />
                <div className="grid max-w-xl gap-2"><Label htmlFor="budget">Estimated budget (PHP)</Label><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-medium text-muted-foreground">₱</span><Input className={`${fieldClass} pl-8`} id="budget" name="budget" type="number" min="1" max="1000000" step="0.01" placeholder="e.g. 500" defaultValue={task?.budget} required /></div><InputError message={errors.budget} /><p className="text-xs leading-5 text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p></div>
            </section>

            <section className={sectionClass}>
                <SectionHeading icon={ClipboardCheck} title="Review and submit" description="Confirm the task follows the community guidelines before sending it for review." />
                <div className="rounded-xl border border-border bg-secondary/40 p-4 sm:p-5"><h3 className="font-semibold text-foreground">Task guidelines</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-5 text-muted-foreground">{options.guidelines.map((guideline) => <li key={guideline}>{guideline}</li>)}</ul></div>
                <div className="mt-5"><label htmlFor="guidelines_confirmed" className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-foreground"><input id="guidelines_confirmed" name="guidelines_confirmed" type="checkbox" value="1" required className="mt-0.5 size-4 shrink-0 accent-primary" /><span>I confirm that this task follows the platform rules.</span></label><InputError message={errors.guidelines_confirmed} /></div>
            </section>

            <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-muted-foreground">Your task will be reviewed before it appears to students.</p><Button className="h-11 w-full rounded-lg px-6 font-semibold sm:w-auto" type="submit" disabled={processing}>{processing ? 'Submitting…' : task ? 'Save changes' : 'Submit task for review'}</Button></div>
            </div>
        </>}
    </Form>;
}
