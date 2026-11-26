<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Conversation;
use App\Models\ConversationEvent;
use App\Models\ConversationMessage;
use App\Models\ConversationRead;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class ConversationWorkflow
{
    public function __construct(private readonly OffPlatformScanner $scanner, private readonly TaskMateNotifications $alerts) {}

    public function createForApplication(Application $application): Conversation
    {
        $application->loadMissing('task');
        $conversation = new Conversation;
        $conversation->application_id = $application->id;
        $conversation->task_id = $application->task_id;
        $conversation->poster_id = $application->task->poster_id;
        $conversation->applicant_id = $application->applicant_id;
        $conversation->save();
        return $conversation;
    }

    public function send(Conversation $conversation, User $sender, string $body): ConversationMessage
    {
        return DB::transaction(function () use ($conversation, $sender, $body): ConversationMessage {
            $conversation = Conversation::query()->lockForUpdate()->findOrFail($conversation->id);
            if ($reason = $conversation->sendingBlockedReason($sender)) {
                throw ValidationException::withMessages(['body' => $reason]);
            }
            $key = 'conversation-message:'.$sender->id;
            $limit = max(1, (int) config('taskmate.messages.rate_limit_per_minute', 10));
            if (RateLimiter::tooManyAttempts($key, $limit)) {
                $seconds = RateLimiter::availableIn($key);
                throw ValidationException::withMessages(['body' => "You have reached the message limit. Try again in {$seconds} seconds."]);
            }
            RateLimiter::hit($key, 60);

            $message = new ConversationMessage;
            $message->conversation_id = $conversation->id;
            $message->sender_id = $sender->id;
            $message->body = trim($body);
            $message->created_at = now();
            $message->save();
            $conversation->touch();
            $this->scanner->flag($message, $sender, 'body', $message->body);
            $recipientId = $sender->id === $conversation->poster_id ? $conversation->applicant_id : $conversation->poster_id;
            $recipient = User::query()->findOrFail($recipientId);
            $task = Task::query()->findOrFail($conversation->task_id);
            $this->alerts->conversationMessage($recipient, $conversation, $task->title, $sender->id, Conversation::displayName($sender));

            return $message;
        });
    }

    public function markRead(Conversation $conversation, User $user, ?int $lastMessageId = null): void
    {
        if (! $this->isParticipant($conversation, $user)) return;
        $latestId = $lastMessageId ?? $conversation->messages()->max('id');
        if (! $latestId) return;
        $read = ConversationRead::query()->where('conversation_id', $conversation->id)->where('user_id', $user->id)->first();
        if (! $read) {
            $read = new ConversationRead;
            $read->conversation_id = $conversation->id;
            $read->user_id = $user->id;
            $read->last_read_message_id = $latestId;
            $read->save();
            return;
        }
        if ((int) ($read->last_read_message_id ?? 0) < $latestId) {
            $read->last_read_message_id = $latestId;
            $read->save();
        }
    }

    public function close(Conversation $conversation, User $user): void
    {
        DB::transaction(function () use ($conversation, $user): void {
            $conversation = Conversation::query()->lockForUpdate()->findOrFail($conversation->id);
            $reason = $conversation->sendingBlockedReason($user);
            if ($conversation->closed_at || $reason) {
                throw ValidationException::withMessages(['conversation' => $reason ?? 'This conversation is already closed.']);
            }
            $conversation->closed_by = $user->id;
            $conversation->closed_at = now();
            $conversation->save();
            $this->recordEvent($conversation, $user, 'closed');
        });
    }

    public function reopen(Conversation $conversation, User $user): void
    {
        DB::transaction(function () use ($conversation, $user): void {
            $conversation = Conversation::query()->lockForUpdate()->findOrFail($conversation->id);
            if (! $conversation->closed_at || $conversation->closed_by !== $user->id) {
                throw ValidationException::withMessages(['conversation' => 'Only the person who closed this conversation can reopen it.']);
            }
            if (! $conversation->isParticipant($user) || ! $user->isVerified()) {
                throw ValidationException::withMessages(['conversation' => 'Only a verified participant can reopen this conversation.']);
            }
            $sanctions = app(SanctionService::class);
            if ($sanctions->suspended($user) || $sanctions->banned($user)) {
                throw ValidationException::withMessages(['conversation' => 'This account cannot reopen conversations right now.']);
            }
            $conversation->closed_by = null;
            $conversation->closed_at = null;
            $conversation->save();
            $this->recordEvent($conversation, $user, 'reopened');
        });
    }

    public function unreadCount(User $user): int
    {
        if ($user->isAdmin()) return 0;
        return ConversationMessage::query()->where('sender_id', '!=', $user->id)
            ->whereHas('conversation', fn ($query) => $query->where(fn ($parties) => $parties->where('poster_id', $user->id)->orWhere('applicant_id', $user->id)))
            ->whereRaw('conversation_messages.id > COALESCE((SELECT last_read_message_id FROM conversation_reads WHERE conversation_reads.conversation_id = conversation_messages.conversation_id AND conversation_reads.user_id = ?), 0)', [$user->id])
            ->distinct('conversation_id')->count('conversation_id');
    }

    private function isParticipant(Conversation $conversation, User $user): bool
    {
        return $conversation->isParticipant($user);
    }

    private function recordEvent(Conversation $conversation, User $user, string $event): void
    {
        $record = new ConversationEvent;
        $record->conversation_id = $conversation->id;
        $record->user_id = $user->id;
        $record->event = $event;
        $record->created_at = now();
        $record->save();
    }
}
