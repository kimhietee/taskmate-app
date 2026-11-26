<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasFirstName = Schema::hasColumn('users', 'first_name');
        $hasMiddleInitial = Schema::hasColumn('users', 'middle_initial');
        $hasLastName = Schema::hasColumn('users', 'last_name');

        if (! $hasFirstName || ! $hasMiddleInitial || ! $hasLastName) {
            Schema::table('users', function (Blueprint $table) use ($hasFirstName, $hasMiddleInitial, $hasLastName) {
                if (! $hasFirstName) {
                    $table->string('first_name', 100)->nullable()->after('name');
                }
                if (! $hasMiddleInitial) {
                    $table->string('middle_initial', 10)->nullable()->after('first_name');
                }
                if (! $hasLastName) {
                    $table->string('last_name', 100)->nullable()->after('middle_initial');
                }
            });
        }
    }

    public function down(): void
    {
        $columns = array_values(array_filter(
            ['first_name', 'middle_initial', 'last_name'],
            fn (string $column) => Schema::hasColumn('users', $column),
        ));

        if ($columns !== []) {
            Schema::table('users', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
