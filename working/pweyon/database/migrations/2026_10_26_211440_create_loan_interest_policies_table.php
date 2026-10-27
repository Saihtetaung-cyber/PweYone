<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('loan_interest_policies', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('name');
            $table->decimal('monthly_rate', 20, 8);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
        DB::table('loan_interest_policies')->insert([
            ['name' => 'လစဉ် 3%', 'monthly_rate' => '3', 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'လစဉ် 4%', 'monthly_rate' => '4', 'active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_interest_policies');
    }
};
