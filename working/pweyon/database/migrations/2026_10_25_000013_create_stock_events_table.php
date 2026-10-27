<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_events', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('document_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('lot_id')->constrained('stock_lots')->restrictOnDelete();
            $t->foreignId('destination_lot_id')->nullable()->constrained('stock_lots')->restrictOnDelete();
            $t->string('kind', 30)->index();
            $t->date('business_date')->index();
            $t->decimal('quantity', 20, 8)->nullable();
            $t->decimal('bags', 20, 8)->nullable();
            $t->json('details')->nullable();
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_events');
    }
};
