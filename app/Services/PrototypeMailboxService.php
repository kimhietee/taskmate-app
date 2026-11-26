<?php

namespace App\Services;

use App\Models\EmailVerificationCode;
use App\Models\User;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class PrototypeMailboxService
{
    private const MAX_MESSAGES_PER_RECIPIENT = 10;

    private const TTL_MINUTES = 20;

    public function isEnabled(): bool
    {
        $allowedEnvironment = app()->environment(['local', 'testing'])
            || (bool) config('taskmate.prototype_mailbox', false);

        return $allowedEnvironment
            && (bool) config('taskmate.prototype_mode', false)
            && config('mail.default') === 'log';
    }

    public function capture(MessageSent $event): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $symfony = $event->sent->getOriginalMessage();
        if (! $symfony instanceof Email) {
            return;
        }

        $recipients = array_values(array_unique(array_filter(array_map(
            fn (Address $address) => Str::lower(trim($address->getAddress())),
            $symfony->getTo(),
        ))));

        if ($recipients === []) {
            return;
        }

        $fromAddress = $symfony->getFrom()[0] ?? null;
        $fromLabel = $fromAddress instanceof Address
            ? trim(($fromAddress->getName() ? $fromAddress->getName().' ' : '').'<'.$fromAddress->getAddress().'>')
            : config('mail.from.name', 'TaskMate').' <'.config('mail.from.address', 'hello@example.com').'>';

        $textBody = (string) ($symfony->getTextBody() ?? '');
        if ($textBody === '' && is_string($symfony->getHtmlBody())) {
            $textBody = trim(html_entity_decode(strip_tags($symfony->getHtmlBody()), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        $code = null;
        if (preg_match('/Verification code:\s*(\d{6})/i', $textBody, $codeMatch) === 1) {
            $code = $codeMatch[1];
        }

        $actionUrl = null;
        if (preg_match('#https?://[^\s"\'<>]+/email/verify/\d+/[a-f0-9]+[^\s"\'<>]*#i', $textBody, $urlMatch) === 1) {
            $actionUrl = html_entity_decode($urlMatch[0], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        $entry = [
            'id' => (string) Str::uuid(),
            'subject' => (string) ($symfony->getSubject() ?: 'TaskMate Notification'),
            'from' => $fromLabel,
            'to' => implode(', ', $recipients),
            'body' => trim($textBody),
            'code' => $code,
            'actionUrl' => $actionUrl,
            'sentAt' => now()->toIso8601String(),
        ];

        foreach ($recipients as $recipient) {
            $key = $this->cacheKey($recipient);
            $existing = Cache::get($key, []);
            if (! is_array($existing)) {
                $existing = [];
            }

            array_unshift($existing, $entry);
            $existing = array_slice($existing, 0, self::MAX_MESSAGES_PER_RECIPIENT);

            Cache::put($key, $existing, now()->addMinutes(self::TTL_MINUTES));
        }
    }

    /** @return array<int, array<string, mixed>> */
    public function messagesForUser(User $user): array
    {
        if (! $this->isEnabled()) {
            return [];
        }

        $emails = $this->addressesForUser($user);
        $collected = [];

        foreach ($emails as $email) {
            $items = Cache::get($this->cacheKey($email), []);
            if (is_array($items)) {
                foreach ($items as $item) {
                    if (is_array($item) && isset($item['id'])) {
                        $collected[$item['id']] = $item;
                    }
                }
            }
        }

        $messages = array_values($collected);
        usort($messages, fn (array $a, array $b) => strcmp((string) ($b['sentAt'] ?? ''), (string) ($a['sentAt'] ?? '')));

        return $messages;
    }

    /** @return array<int, string> */
    public function addressesForUser(User $user): array
    {
        $addresses = [Str::lower(trim($user->email))];

        if (filled($user->institutional_email)) {
            $addresses[] = Str::lower(trim((string) $user->institutional_email));
        }

        $pendingInstitutional = EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('purpose', EmailVerificationCode::PURPOSE_STUDENT_INSTITUTIONAL_EMAIL)
            ->latest('id')
            ->limit(3)
            ->pluck('email')
            ->all();

        foreach ($pendingInstitutional as $email) {
            if (is_string($email) && trim($email) !== '') {
                $addresses[] = Str::lower(trim($email));
            }
        }

        return array_values(array_unique($addresses));
    }

    private function cacheKey(string $email): string
    {
        return 'prototype_mailbox:'.hash('sha256', Str::lower(trim($email)));
    }
}
