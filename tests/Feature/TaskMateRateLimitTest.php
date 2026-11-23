<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\ReportEvidence;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskMateRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_and_registration_have_configured_limits(): void
    {
        config(['taskmate.rate_limits.login.max_attempts' => 1, 'taskmate.rate_limits.register.max_attempts' => 1]);
        RateLimiter::clear('wrong@example.test|127.0.0.1');
        $this->post('/login', ['email' => 'wrong@example.test', 'password' => 'wrong'])->assertRedirect();
        $this->post('/login', ['email' => 'wrong@example.test', 'password' => 'wrong'])->assertTooManyRequests();

        RateLimiter::clear('register|127.0.0.1');
        $this->post('/register', [])->assertRedirect();
        $this->post('/register', [])->assertTooManyRequests();
    }

    public function test_application_submission_has_a_configured_limit(): void
    {
        config(['taskmate.rate_limits.apply.max_attempts' => 1]);
        $student = User::factory()->verified()->create();
        $task = Task::factory()->approved()->create();
        $url = '/browse/'.$task->id.'/apply';
        RateLimiter::clear('apply|'.$student->id);
        $data = [
            'message' => 'Synthetic application.',
            'work_details_confirmed' => '1',
            'poster_identity_checked' => '1',
            'no_upfront_fee_checked' => '1',
        ];
        $this->actingAs($student)->post($url, $data)->assertRedirect();
        $this->actingAs($student)->post($url, $data)->assertTooManyRequests();
    }

    public function test_report_submission_has_a_configured_limit(): void
    {
        config(['taskmate.rate_limits.report.max_attempts' => 1]);
        $student = User::factory()->verified()->create();
        $poster = User::factory()->verified()->facultyStaff()->create();
        $task = Task::factory()->approved()->create(['poster_id' => $poster->id]);
        RateLimiter::clear('report|'.$student->id);
        $data = ['type' => 'other', 'description' => 'Synthetic concern for rate-limit coverage.'];
        $this->actingAs($student)->post('/tasks/'.$task->id.'/problem-reports', $data)->assertRedirect();
        $this->actingAs($student)->post('/tasks/'.$task->id.'/problem-reports', $data)->assertTooManyRequests();
    }

    public function test_evidence_download_has_a_configured_limit(): void
    {
        config(['taskmate.rate_limits.evidence_download.max_attempts' => 1]);
        Storage::fake('evidence');
        $report = Report::factory()->create();
        $evidence = new ReportEvidence();
        $evidence->report_id = $report->id;
        $evidence->uploaded_by = $report->reporter_id;
        $evidence->original_name = 'synthetic.pdf';
        $evidence->stored_path = 'synthetic/'.uniqid().'.pdf';
        $evidence->mime = 'application/pdf';
        $evidence->size_bytes = 4;
        $evidence->created_at = now();
        $evidence->save();
        Storage::disk('evidence')->put($evidence->stored_path, '%PDF');
        RateLimiter::clear('evidence_download|'.$report->reporter_id);
        $url = '/reports/'.$report->id.'/evidence/'.$evidence->id;
        $this->actingAs(User::findOrFail($report->reporter_id))->get($url)->assertOk();
        $this->actingAs(User::findOrFail($report->reporter_id))->get($url)->assertTooManyRequests();
    }
}
