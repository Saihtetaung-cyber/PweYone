<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Opening Cash Flow Update 2: retain original counts and store review/evidence separately.
     */
    public function up(): void
    {
        Schema::table('business_days', function (Blueprint $table) {
            $table->json('opening_review')->nullable();
        });
    }

    /**
     * Removing this column loses review history; keep it when reverting UI/service code.
     */
    public function down(): void
    {
        Schema::table('business_days', function (Blueprint $table) {
            $table->dropColumn('opening_review');
        });
    }
};
