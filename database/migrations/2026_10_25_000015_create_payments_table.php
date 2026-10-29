<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('document_id')->constrained()->restrictOnDelete();
            $t->foreignId('line_id')->nullable()->constrained('document_lines')->restrictOnDelete();
            $t->foreignId('account_id')->nullable()->constrained('cash_accounts')->restrictOnDelete();
            $t->foreignId('cash_entry_id')->nullable()->unique()->constrained('cash_entries')->restrictOnDelete();
            $t->foreignId('source_document_id')->nullable()->constrained('documents')->restrictOnDelete();
            $t->date('business_date');
            $t->string('mode', 20)->default('cash');
            $t->decimal('amount', 24, 2);
            $t->decimal('principal', 24, 2)->default(0);
            $t->decimal('interest', 24, 2)->default(0);
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
