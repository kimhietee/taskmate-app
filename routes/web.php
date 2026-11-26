<?php

use App\Http\Controllers\Auth\VerifyEmailCodeController;
use App\Http\Controllers\Auth\VerifyPasswordResetCodeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PrototypeMailboxController;
use App\Http\Controllers\StudentVerificationController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminTasksController;
use App\Http\Controllers\Admin\AdminTaskDecisionController;
use App\Http\Controllers\Admin\VerificationDecisionController;
use App\Http\Controllers\VerificationDetailsController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\BrowseController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AgreementController;
use App\Http\Controllers\CompletionPaymentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\Admin\AdminRatingsController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminReportDecisionController;
use App\Http\Controllers\GeneralReportController;
use App\Http\Controllers\SanctionsController;
use App\Http\Controllers\Admin\AdminSanctionsController;
use App\Http\Controllers\Admin\AdminFlagsController;
use App\Http\Controllers\Admin\AdminTaskClosureController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicInformationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\ConversationMessageReportController;
use App\Http\Controllers\ClassScheduleController;

Route::inertia('/', 'welcome')->name('home');
Route::get('/how-it-works', PublicInformationController::class)->defaults('page', 'how-it-works')->name('static.how-it-works');
Route::get('/task-guidelines', PublicInformationController::class)->defaults('page', 'task-guidelines')->name('static.task-guidelines');
Route::get('/safety-and-limits', PublicInformationController::class)->defaults('page', 'safety-and-limits')->name('static.safety');
Route::get('/privacy', PublicInformationController::class)->defaults('page', 'privacy')->name('static.privacy');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
    });

Route::middleware(['auth', 'verified'])
    ->get('/dashboard', DashboardController::class)
    ->name('taskmate.dashboard');

Route::middleware(['auth:web', 'throttle:6,1'])
    ->post('/email/verify-code', VerifyEmailCodeController::class)
    ->name('verification.verify-code');

Route::middleware(['auth:web'])
    ->get('/prototype/mailbox', PrototypeMailboxController::class)
    ->name('prototype.mailbox');

Route::middleware(['guest:web', 'throttle:6,1'])
    ->post('/forgot-password/verify-code', VerifyPasswordResetCodeController::class)
    ->name('password.verify-code');

Route::middleware(['guest:web'])
    ->get('/prototype/password-reset-mailbox', [PrototypeMailboxController::class, 'passwordReset'])
    ->name('prototype.password-reset-mailbox');

Route::middleware(['auth', 'verified', 'account.active'])->group(function () {
    Route::get('/verification/student', [StudentVerificationController::class, 'show'])->name('verification.student.show');
    Route::post('/verification/student/institutional-code', [StudentVerificationController::class, 'sendInstitutionalCode'])
        ->middleware('throttle:6,1')
        ->name('verification.student.send-code');
    Route::post('/verification/student/institutional-verify', [StudentVerificationController::class, 'verifyInstitutionalCode'])
        ->middleware('throttle:6,1')
        ->name('verification.student.verify-code');
    Route::post('/verification/student/manual-request', [StudentVerificationController::class, 'requestManualReview'])
        ->middleware('throttle:6,1')
        ->name('verification.student.manual-request');
});

Route::middleware(['auth', 'account.active'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');

    Route::get('verification/details', [VerificationDetailsController::class, 'edit'])->name('verification.details.edit');
    Route::put('verification/details', [VerificationDetailsController::class, 'update'])->name('verification.details.update');
});

Route::middleware(['auth', 'account.verified', 'account.active'])->group(function () {
    Route::get('/messages', [ConversationController::class, 'index'])->name('messages.index');
    Route::get('/messages/{conversation}', [ConversationController::class, 'show'])->name('messages.show');
    Route::get('/messages/{conversation}/updates', [ConversationController::class, 'updates'])->name('messages.updates');
    Route::post('/messages/{conversation}/send', [ConversationController::class, 'send'])->name('messages.send');
    Route::post('/messages/{conversation}/close', [ConversationController::class, 'close'])->name('messages.close');
    Route::post('/messages/{conversation}/reopen', [ConversationController::class, 'reopen'])->name('messages.reopen');
    Route::post('/messages/{conversation}/messages/{message}/report', ConversationMessageReportController::class)->name('messages.report');
});

Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');
    Route::get('/users', [AdminUsersController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [AdminUsersController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/verification', VerificationDecisionController::class)->name('users.verification');
    Route::post('/users/{user}/sanctions', [AdminSanctionsController::class, 'issue'])->name('users.sanctions');
    Route::post('/sanctions/{sanction}/lift', [AdminSanctionsController::class, 'lift'])->name('sanctions.lift');
    Route::get('/tasks', [AdminTasksController::class, 'index'])->name('tasks.index');
    Route::get('/tasks/{task}', [AdminTasksController::class, 'show'])->name('tasks.show');
    Route::post('/tasks/{task}/decision', AdminTaskDecisionController::class)->name('tasks.decision');
    Route::get('/agreements/{agreement}', [AgreementController::class, 'adminShow'])->name('agreements.show');
    Route::get('/reports', [AdminReportsController::class, 'index'])->name('reports.index');
    Route::get('/reports/{report}', [AdminReportsController::class, 'show'])->name('reports.show');
    Route::post('/reports/{report}/decision', AdminReportDecisionController::class)->name('reports.decision');
    Route::get('/flags', [AdminFlagsController::class, 'index'])->name('flags.index');
    Route::get('/flags/{flag}', [AdminFlagsController::class, 'show'])->name('flags.show');
    Route::post('/flags/{flag}/decision', [AdminFlagsController::class, 'decision'])->name('flags.decision');
    Route::post('/tasks/{task}/close', AdminTaskClosureController::class)->name('tasks.close');
    Route::get('/ratings', [AdminRatingsController::class, 'index'])->name('ratings.index');
    Route::get('/ratings/{rating}', [AdminRatingsController::class, 'show'])->name('ratings.show');
    Route::post('/ratings/{rating}/moderate', [AdminRatingsController::class, 'moderate'])->name('ratings.moderate');
});

Route::middleware(['auth', 'account.active', 'account.verified', 'can.post'])->group(function () {
    Route::get('/tasks/create', [TaskController::class, 'create'])->name('tasks.create');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::get('/my-tasks', [TaskController::class, 'mine'])->name('tasks.mine');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::get('/tasks/{task}/edit', [TaskController::class, 'edit'])->name('tasks.edit');
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::post('/tasks/{task}/cancel', [TaskController::class, 'cancel'])->name('tasks.cancel');
});

Route::middleware(['auth', 'account.active', 'account.verified'])->group(function () {
    Route::get('/tasks/{task}/agreement', [AgreementController::class, 'create'])->name('agreements.create');
    Route::post('/tasks/{task}/agreement', [AgreementController::class, 'store'])->name('agreements.store');
    Route::get('/agreements/{agreement}', [AgreementController::class, 'show'])->name('agreements.show');
    Route::get('/agreements/{agreement}/rate', [RatingController::class, 'create'])->name('agreements.rate');
    Route::post('/agreements/{agreement}/rate', [RatingController::class, 'store'])->name('agreements.rate.store');
    Route::post('/agreements/{agreement}/versions', [AgreementController::class, 'revise'])->name('agreements.revise');
    Route::post('/agreements/{agreement}/confirm', [AgreementController::class, 'confirm'])->name('agreements.confirm');
    Route::post('/agreements/{agreement}/send-back', [AgreementController::class, 'sendBack'])->name('agreements.send-back');
    Route::post('/agreements/{agreement}/cancel', [AgreementController::class, 'cancel'])->name('agreements.cancel');
    Route::post('/agreements/{agreement}/completion/delivered', [CompletionPaymentController::class, 'markDelivered'])->name('agreements.completion.delivered');
    Route::post('/agreements/{agreement}/completion/complete', [CompletionPaymentController::class, 'complete'])->name('agreements.completion.complete');
    Route::post('/agreements/{agreement}/payments/mark-paid', [CompletionPaymentController::class, 'markPaid'])->name('agreements.payments.mark-paid');
    Route::post('/agreements/{agreement}/payments/confirm-received', [CompletionPaymentController::class, 'confirmReceived'])->name('agreements.payments.confirm-received');
    Route::post('/agreements/{agreement}/payments/not-received', [CompletionPaymentController::class, 'reportNotReceived'])->name('agreements.payments.not-received');
    Route::post('/agreements/{agreement}/reports', [ReportController::class, 'store'])->name('agreements.reports.store');
    Route::post('/agreements/{agreement}/problem-reports', [GeneralReportController::class, 'agreement'])->name('agreements.problem-reports.store');
    Route::post('/tasks/{task}/problem-reports', [GeneralReportController::class, 'task'])->name('tasks.problem-reports.store');
    Route::post('/tasks/{task}/applications/{application}/problem-reports', [GeneralReportController::class, 'applicant'])->name('applications.problem-reports.store');
    Route::post('/users/{user}/problem-reports', [GeneralReportController::class, 'profile'])->name('users.problem-reports.store');
    Route::get('/my-reports', [ReportController::class, 'mine'])->name('reports.mine');
    Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
    Route::post('/reports/{report}/statements', [ReportController::class, 'reply'])->name('reports.reply');
    Route::get('/reports/{report}/evidence/{evidence}', [ReportController::class, 'evidence'])->name('reports.evidence');
});

Route::middleware(['auth', 'account.active'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/summary', [NotificationController::class, 'summary'])->name('notifications.summary');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::get('/notifications/{notification}/open', [NotificationController::class, 'open'])->name('notifications.open');
    Route::get('/my-sanctions', [SanctionsController::class, 'index'])->name('sanctions.mine');
    Route::post('/my-sanctions/{sanction}/acknowledge', [SanctionsController::class, 'acknowledge'])->name('sanctions.acknowledge');
});

Route::middleware(['auth', 'verified', 'account.active', 'can.browse'])->group(function () {
    Route::get('/browse', [BrowseController::class, 'index'])->name('browse.index');
    Route::get('/browse/{task}', [BrowseController::class, 'show'])->name('browse.show');
});

Route::middleware(['auth', 'account.active', 'account.verified', 'can.apply'])->group(function () {
    Route::post('/browse/{task}/apply', [ApplicationController::class, 'store'])->name('applications.store');
    Route::put('/my-class-schedule', [ClassScheduleController::class, 'update'])->name('class-schedule.update');
    Route::get('/my-applications', [ApplicationController::class, 'mine'])->name('applications.mine');
    Route::get('/my-applications/{application}/task', [BrowseController::class, 'applicationTask'])->name('applications.task');
    Route::post('/my-applications/{application}/withdraw', [ApplicationController::class, 'withdraw'])->name('applications.withdraw');
});

Route::middleware(['auth', 'account.active', 'account.verified', 'can.post'])->group(function () {
    Route::post('/tasks/{task}/applications/{application}/accept', [ApplicationController::class, 'accept'])->name('tasks.applications.accept');
    Route::post('/tasks/{task}/applications/{application}/decline', [ApplicationController::class, 'decline'])->name('tasks.applications.decline');
});

Route::middleware(['auth', 'account.active'])->get('/users/{user}', [UserProfileController::class, 'show'])->name('users.show');

require __DIR__.'/settings.php';
