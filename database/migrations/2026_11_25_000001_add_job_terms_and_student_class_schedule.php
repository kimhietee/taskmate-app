<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->decimal('budget', 10, 2)->nullable()->change();
            $table->boolean('budget_to_be_discussed')->default(false)->after('budget');
            $table->string('pay_timing', 40)->nullable()->after('budget_to_be_discussed');
            $table->string('pay_timing_note', 255)->nullable()->after('pay_timing');
            $table->json('schedule_days')->nullable()->after('deadline');
            $table->string('schedule_start_time', 5)->nullable()->after('schedule_days');
            $table->string('schedule_end_time', 5)->nullable()->after('schedule_start_time');
            $table->string('schedule_note', 255)->nullable()->after('schedule_end_time');
            $table->boolean('schedule_to_be_discussed')->default(false)->after('schedule_note');
            $table->boolean('can_hours_change')->nullable()->after('schedule_to_be_discussed');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->json('class_schedule')->nullable()->after('supporting_info');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('class_schedule');
        });

        DB::table('tasks')->whereNull('budget')->update(['budget' => 1]);

        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn([
                'budget_to_be_discussed',
                'pay_timing',
                'pay_timing_note',
                'schedule_days',
                'schedule_start_time',
                'schedule_end_time',
                'schedule_note',
                'schedule_to_be_discussed',
                'can_hours_change',
            ]);
            $table->decimal('budget', 10, 2)->nullable(false)->change();
        });
    }
};
