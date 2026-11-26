<?php

namespace App\Services;

use App\Models\User;
use App\Models\Conversation;
use App\Notifications\TaskMateAlert;
use App\Notifications\TaskMateAlertCatalog;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;

class TaskMateNotifications
{
    /** @param array<string, int> $relatedIds */
    public function send(User|iterable $recipients, string $event, string $url, array $relatedIds = [], array $values = [], ?int $actorId = null): void
    {
        $recipients = $recipients instanceof User ? collect([$recipients]) : collect($recipients);
        $copy = TaskMateAlertCatalog::get($event, $values);
        $payload = [
            'event' => $event,
            ...$copy,
            'url' => $this->safeUrl($url),
            'related_ids' => array_filter($relatedIds, fn ($id) => is_int($id)),
        ];
        $ids = $recipients->filter(fn ($recipient) => $recipient instanceof User && $recipient->id !== $actorId)->pluck('id')->unique()->values();

        foreach ($ids as $id) {
            DB::afterCommit(function () use ($id, $payload): void {
                if ($recipient = User::query()->find($id)) {
                    $recipientPayload = $payload;
                    if (! $recipient->isAdmin() && ! $recipient->isVerified()
                        && ! str_starts_with($recipientPayload['event'], 'account.')) {
                        $recipientPayload['url'] = route('notifications.index', [], false);
                    }
                    $recipient->notify(new TaskMateAlert($recipientPayload));
                }
            });
        }
    }

    /** @param array<string, int> $relatedIds */
    public function admins(string $event, string $url, array $relatedIds = [], array $values = [], ?int $actorId = null): void
    {
        $this->send(User::query()->where('is_admin', true)->get(), $event, $url, $relatedIds, $values, $actorId);
    }

    public function conversationMessage(User $recipient, Conversation $conversation, string $taskTitle, int $actorId, ?string $senderName = null): void
    {
        if ($recipient->id === $actorId) return;
        $copy = TaskMateAlertCatalog::get('conversation.message', [
            'task_title' => $taskTitle,
            'sender_name' => $senderName ?: 'Someone',
        ]);
        $payload = [
            'event' => 'conversation.message',
            ...$copy,
            'url' => $this->safeUrl(route('messages.show', $conversation->id, false)),
            'related_ids' => ['task_id' => $conversation->task_id, 'application_id' => $conversation->application_id],
            'conversation_id' => $conversation->id,
            'count' => 1,
        ];
        $recipientId = $recipient->id;
        DB::afterCommit(function () use ($recipientId, $payload): void {
            $user = User::query()->find($recipientId);
            if (! $user) return;
            $existing = $user->unreadNotifications()
                ->latest('created_at')
                ->get()
                ->first(fn (DatabaseNotification $notification): bool => ($notification->data['event'] ?? null) === 'conversation.message'
                    && (int) ($notification->data['conversation_id'] ?? 0) === (int) $payload['conversation_id']);
            if ($existing) {
                $data = $existing->data;
                $data['count'] = ((int) ($data['count'] ?? 1)) + 1;
                $data['title'] = $payload['title'];
                $data['body'] = $payload['body'];
                $existing->data = $data;
                $existing->created_at = now();
                $existing->save();
                return;
            }
            if (! $user->isVerified()) $payload['url'] = route('notifications.index', [], false);
            $user->notify(new TaskMateAlert($payload));
        });
    }

    private function safeUrl(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH);
        abort_unless(is_string($path) && str_starts_with($path, '/') && ! str_starts_with($path, '//'), 500, 'Notification targets must be local paths.');
        return $url;
    }
}
