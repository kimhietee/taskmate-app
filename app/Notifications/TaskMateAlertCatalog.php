<?php

namespace App\Notifications;

class TaskMateAlertCatalog
{
    /** @return array{title: string, body: string} */
    public static function get(string $event, array $values = []): array
    {
        $catalog = [
            'account.approved' => ['Account verified', 'Your account was verified. You can review the dashboard for next steps.'],
            'account.rejected' => ['Account review updated', 'Your account review was updated. Check the dashboard for details.'],
            'account.more_info_requested' => ['More information requested', 'An administrator needs more information. Check the dashboard for next steps.'],
            'account.resubmitted' => ['Account awaiting review', 'An account was resubmitted and is awaiting review.'],
            'account.awaiting_review' => ['Account awaiting review', 'A new account is awaiting administrator review.'],
            'task.approved' => ['Task approved', 'Your task was approved.'],
            'task.rejected' => ['Task review updated', 'Your task could not be approved. Check your task page for details.'],
            'task.changes_requested' => ['Changes requested', 'An administrator requested changes to your task. Check your task page.'],
            'task.removed' => ['Task removed', 'Your task was removed by an administrator.'],
            'task.awaiting_review' => ['Task awaiting review', 'A task is awaiting administrator review.'],
            'application.new' => ['New application', 'A student applied to one of your tasks.'],
            'application.accepted' => ['Application accepted', 'Your application was accepted.'],
            'application.declined' => ['Application update', 'Your application was declined.'],
            'application.cancelled' => ['Application cancelled', 'Your application was cancelled.'],
            'application.withdrawn' => ['Application withdrawn', 'An applicant withdrew from your task.'],
            'agreement.proposed' => ['Agreement proposed', 'The poster proposed an agreement.'],
            'agreement.revised' => ['Agreement revised', 'A new agreement version is ready for you.'],
            'agreement.sent_back' => ['Agreement comment received', 'The other party sent back a comment about the agreement.'],
            'agreement.confirmed' => ['Agreement confirmation received', 'The other party confirmed the current agreement.'],
            'agreement.locked' => ['Agreement confirmed', 'Both parties confirmed the agreement. The terms are locked.'],
            'agreement.cancelled' => ['Agreement cancelled', 'The agreement was cancelled. The task is open again.'],
            'agreement.admin_cancelled' => ['Task agreement cancelled', 'An administrator cancelled the agreement.'],
            'completion.delivered' => ['Work marked as delivered', 'The worker marked work as delivered.'],
            'completion.recorded' => ['Task completed', 'The poster recorded the task as completed.'],
            'payment.marked' => ['Payment status updated', 'The poster recorded a payment.'],
            'payment.received' => ['Payment receipt confirmed', 'The worker confirmed receipt.'],
            'payment.received_exceeds' => ['Payment receipt confirmed (exceeds agreed amount)', 'The worker confirmed receiving a payment that exceeds the agreed amount. Check the agreement for details.'],
            'payment.not_received' => ['Payment response received', 'The worker reported not receiving payment.'],
            'rating.waiting' => ['Rating waiting for you', 'A completed task is ready for you to rate your experience.'],
            'rating.visible' => ['Ratings are now visible', 'A rating for your completed task is now visible.'],
            'report.under_review' => ['Report under review', 'Your report is now under review.'],
            'report.resolved' => ['Report review complete', 'Your report was resolved ({outcome}).'],
            'report.dismissed' => ['Report review complete', 'Your report was dismissed.'],
            'report.reply' => ['Report response added', 'A response was added to your report.'],
            'report.filed' => ['A report was filed', 'A report about a related TaskMate activity was filed.'],
            'report.new' => ['New report for review', 'A new report is awaiting administrator review.'],
            'report.priority' => ['Priority report for review', 'A high-priority report is awaiting administrator review.'],
            'sanction.warning' => ['Account warning', 'An account warning was issued. Review your account actions.'],
            'sanction.suspension' => ['Account suspended', 'Your account was suspended. Review your account actions.'],
            'sanction.lifted' => ['Account action lifted', 'An account action was lifted. You can review your account actions.'],
            'flag.new' => ['New content flag', 'A new content flag is awaiting administrator review.'],
            'conversation.message' => ['New message about {task_title}', '{sender_name} sent a message. Open TaskMate to read it.'],
        ];

        abort_unless(isset($catalog[$event]), 500, 'Unknown TaskMate notification event.');
        [$title, $body] = $catalog[$event];
        $values = ['sender_name' => 'Someone', ...$values];
        foreach ($values as $key => $value) {
            $replacement = match ($key) {
                'outcome' => in_array($value, ['supported', 'not_supported', 'inconclusive'], true) ? str_replace('_', ' ', $value) : 'completed',
                'task_title' => self::sanitizeText((string) $value, 120),
                'sender_name' => self::sanitizeText((string) $value, 80) ?: 'Someone',
                default => '',
            };
            $title = str_replace('{'.$key.'}', $replacement, $title);
            $body = str_replace('{'.$key.'}', $replacement, $body);
        }

        return ['title' => $title, 'body' => $body];
    }

    private static function sanitizeText(string $value, int $maxLength): string
    {
        $stripped = preg_replace('/[\x00-\x1F\x7F]/u', ' ', strip_tags($value)) ?? '';
        $redacted = preg_replace('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', '[contact removed]', $stripped) ?? '';

        return mb_substr(trim($redacted), 0, $maxLength);
    }

    /** @return array<string, array{title: string, body: string}> */
    public static function all(): array
    {
        $events = [
            'account.approved', 'account.rejected', 'account.more_info_requested', 'account.resubmitted', 'account.awaiting_review',
            'task.approved', 'task.rejected', 'task.changes_requested', 'task.removed', 'task.awaiting_review',
            'application.new', 'application.accepted', 'application.declined', 'application.cancelled', 'application.withdrawn',
            'agreement.proposed', 'agreement.revised', 'agreement.sent_back', 'agreement.confirmed', 'agreement.locked', 'agreement.cancelled', 'agreement.admin_cancelled',
            'completion.delivered', 'completion.recorded', 'payment.marked', 'payment.received', 'payment.received_exceeds', 'payment.not_received',
            'rating.waiting', 'rating.visible', 'report.under_review', 'report.resolved', 'report.dismissed', 'report.reply', 'report.filed', 'report.new', 'report.priority',
            'sanction.warning', 'sanction.suspension', 'sanction.lifted', 'flag.new', 'conversation.message',
        ];
        return collect($events)->mapWithKeys(fn (string $event) => [$event => self::get($event, [
            'outcome' => 'supported',
            'task_title' => 'Sample task',
            'sender_name' => 'A participant',
        ])])->all();
    }
}
