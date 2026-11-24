<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentInstitutionalCodeNotification extends Notification
{
    public function __construct(
        private string $code,
        private int $expiryMinutes,
    ) {
        //
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your TaskMate CMU Student Verification Code')
            ->line('Enter this 6-digit code on TaskMate to confirm your CMU institutional email and verify your student account:')
            ->line("Verification code: {$this->code}")
            ->line("This code expires in {$this->expiryMinutes} minutes.")
            ->line('TaskMate will keep your login email unchanged and will never share your institutional email publicly.')
            ->line('If you did not request student verification on TaskMate, you can safely ignore this message.');
    }
}
