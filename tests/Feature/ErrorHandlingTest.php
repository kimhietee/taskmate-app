<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    public function test_server_exception_is_logged_with_its_stack_trace(): void
    {
        Log::spy();
        Route::get('/__test/exception-log', fn () => throw new RuntimeException('Logged exception marker'));

        $this->get('/__test/exception-log')->assertStatus(500);

        Log::shouldHaveReceived('error')->once()->withArgs(fn (string $message, array $context): bool =>
            $message === 'Logged exception marker'
            && ($context['exception'] ?? null) instanceof RuntimeException
            && $context['exception']->getTraceAsString() !== ''
        );
    }

    public function test_local_debug_mode_keeps_laravels_exception_page(): void
    {
        $this->app['env'] = 'local';
        config(['app.debug' => true]);
        Route::get('/__test/local-debug', fn () => throw new RuntimeException('Local debug marker'));

        $response = $this->get('/__test/local-debug')->assertStatus(500);

        $this->assertStringContainsString('Local debug marker', $response->getContent());
        $this->assertStringContainsString(RuntimeException::class, $response->getContent());
        $this->assertSame(0, preg_match('#data-page="[^"]*errors(?:\\\\/|/)status#', $response->getContent()));
        $this->assertStringNotContainsString('id="app" '.'data-page=', $response->getContent());
    }
}
