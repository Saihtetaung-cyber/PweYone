<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_entries', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('account_id')->constrained('cash_accounts')->restrictOnDelete();
            $t->foreignId('document_id')->constrained()->restrictOnDelete();
            $t->foreignId('reverses_id')->nullable()->unique()->constrained('cash_entries')->restrictOnDelete();
            $t->date('business_date')->index();
            $t->decimal('amount', 24, 2);
            $t->string('title');
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_entries');
    }
};
