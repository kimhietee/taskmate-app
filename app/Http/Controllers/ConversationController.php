<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConversationMessageRequest;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\User;
use App\Services\ConversationWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if($request->user()->isAdmin(), 403);
        $user = $request->user();
        $conversations = Conversation::query()
            ->where(fn ($query) => $query->where('poster_id', $user->id)->orWhere('applicant_id', $user->id))
            ->with(['task:id,title', 'poster:id,name,user_type,organization_name,verification_status', 'applicant:id,name,user_type,organization_name,verification_status', 'latestMessage.sender:id,name,user_type,organization_name', 'reads' => fn ($query) => $query->where('user_id', $user->id)])
            ->withMax('messages', 'id')->orderByDesc('messages_max_id')->orderByDesc('updated_at')->paginate(20)->withQueryString()
            ->through(fn (Conversation $conversation) => $this->inboxItem($conversation, $user));

        return Inertia::render('messages/index', ['conversations' => $conversations]);
    }

    public function show(Request $request, Conversation $conversation, ConversationWorkflow $workflow): Response
    {
        Gate::authorize('view', $conversation);
        $user = $request->user();
        $conversation->load(['task:id,title,status', 'poster:id,name,user_type,organization_name,verification_status', 'applicant:id,name,user_type,organization_name,verification_status', 'messages.sender:id,name,user_type,organization_name', 'messages.contentFlags', 'events.user:id,name,user_type,organization_name', 'closer:id,name,user_type,organization_name']);
        $workflow->markRead($conversation, $user);
        $other = $user->id === $conversation->poster_id ? $conversation->applicant : $conversation->poster;
        $reason = $conversation->sendingBlockedReason($user);

        return Inertia::render('messages/show', [
            'conversation' => [
                'id' => $conversation->id,
                'taskId' => $conversation->task_id,
                'taskTitle' => $conversation->task->title,
                'otherPerson' => [
                    'name' => Conversation::displayName($other),
                    'type' => config('taskmate.user_types.'.$other->user_type->value, $other->user_type->value),
                    'verificationStatus' => $other->verification_status->value,
                ],
                'status' => $conversation->closed_at ? 'closed' : ($reason ? 'read_only' : 'open'),
                'closedBy' => $conversation->closer ? Conversation::displayName($conversation->closer) : null,
                'closedAt' => $conversation->closed_at?->toDateTimeString(),
                'sendBlockedReason' => $reason,
                'canSend' => $reason === null,
                'canClose' => $user->can('close', $conversation),
                'canReopen' => $user->can('reopen', $conversation),
                'lastMessageId' => $conversation->messages->last()?->id ?? 0,
            ],
            'messages' => $conversation->messages->map(fn (ConversationMessage $message) => $this->messageItem($message, $user))->values(),
            'events' => $conversation->events->map(fn ($event) => [
                'id' => $event->id,
                'event' => $event->event,
                'actor' => Conversation::displayName($event->user),
                'createdAt' => $event->created_at?->toDateTimeString(),
            ])->values(),
            'messageMaxLength' => (int) config('taskmate.messages.max_length', 1000),
            'pollSeconds' => (int) config('taskmate.notifications.poll_seconds', 10),
            'reportContextMessages' => (int) config('taskmate.messages.report_context_messages', 5),
            'reportTypes' => collect(config('taskmate.reports.types', []))->only(['harassment', 'unsafe_behavior', 'off_platform_transaction', 'rule_bypass_request', 'misleading_description', 'fraudulent_post', 'other'])->map(fn ($type, $value) => ['value' => $value, 'label' => $type['label']])->values(),
        ]);
    }

    public function send(StoreConversationMessageRequest $request, Conversation $conversation, ConversationWorkflow $workflow): RedirectResponse
    {
        $workflow->send($conversation, $request->user(), $request->validated('body'));
        return to_route('messages.show', $conversation);
    }

    public function updates(Request $request, Conversation $conversation, ConversationWorkflow $workflow): JsonResponse
    {
        Gate::authorize('view', $conversation);
        $cursor = $request->validate(['after_id' => ['sometimes', 'integer', 'min:0']]);
        $messages = $conversation->messages()->with(['sender:id,name,user_type,organization_name', 'contentFlags'])
            ->when(isset($cursor['after_id']), fn ($query) => $query->where('id', '>', (int) $cursor['after_id']))
            ->orderBy('id')->limit(100)->get();
        if ($messages->isNotEmpty()) $workflow->markRead($conversation, $request->user(), $messages->last()->id);
        return response()->json(['messages' => $messages->map(fn ($message) => $this->messageItem($message, $request->user()))->values()]);
    }

    public function close(Request $request, Conversation $conversation, ConversationWorkflow $workflow): RedirectResponse
    {
        Gate::authorize('close', $conversation);
        $workflow->close($conversation, $request->user());
        return to_route('messages.show', $conversation)->with('status', 'The conversation is now read-only. You can reopen it later.');
    }

    public function reopen(Request $request, Conversation $conversation, ConversationWorkflow $workflow): RedirectResponse
    {
        Gate::authorize('reopen', $conversation);
        $workflow->reopen($conversation, $request->user());
        return to_route('messages.show', $conversation)->with('status', 'The conversation was reopened.');
    }

    private function inboxItem(Conversation $conversation, User $user): array
    {
        $other = $conversation->poster_id === $user->id ? $conversation->applicant : $conversation->poster;
        $latest = $conversation->latestMessage;
        $reason = $conversation->sendingBlockedReason($user);

        return [
            'id' => $conversation->id,
            'taskTitle' => $conversation->task->title,
            'otherPerson' => ['name' => Conversation::displayName($other), 'type' => config('taskmate.user_types.'.$other->user_type->value), 'verificationStatus' => $other->verification_status->value],
            'preview' => $latest?->body,
            'latestAt' => $latest?->created_at?->toDateTimeString(),
            'unreadCount' => $conversation->unreadCountFor($user),
            'status' => $conversation->closed_at ? 'closed' : ($reason ? 'read_only' : 'open'),
        ];
    }

    private function messageItem(ConversationMessage $message, User $viewer): array
    {
        $sender = $message->sender;
        return [
            'id' => $message->id,
            'senderId' => $sender->id,
            'senderName' => Conversation::displayName($sender),
            'isMine' => $sender->id === $viewer->id,
            'body' => $message->body,
            'createdAt' => $message->created_at?->toDateTimeString(),
            'flaggedForRecipient' => ! $message->contentFlags->where('source_user_id', '!=', $viewer->id)->where('status.value', 'open')->isEmpty(),
            'reportUrl' => $sender->id === $viewer->id ? null : route('messages.report', [$message->conversation_id, $message->id], false),
        ];
    }
}
