<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('work_type', 40)->nullable()->after('category');
            $table->boolean('schedule_flexible')->default(false)->after('schedule_to_be_discussed');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn(['work_type', 'schedule_flexible']);
        });
    }
};
