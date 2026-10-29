<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_checks', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('lot_id')->constrained('stock_lots')->restrictOnDelete();
            $t->date('business_date');
            $t->decimal('expected_quantity', 20, 8)->nullable();
            $t->decimal('expected_bags', 20, 8)->nullable();
            $t->decimal('actual_quantity', 20, 8)->nullable();
            $t->decimal('actual_bags', 20, 8)->nullable();
            $t->string('status', 20);
            $t->string('fingerprint', 64);
            $t->text('reason');
            $t->foreignId('submitted_by')->constrained('users')->restrictOnDelete();
            $t->foreignId('decided_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('decided_at')->nullable();
            $t->text('decision_note')->nullable();
            $t->index(['lot_id', 'status']);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_checks');
    }
};
