<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_lines', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('document_id')->constrained()->restrictOnDelete();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->foreignId('warehouse_id')->constrained()->restrictOnDelete();
            $t->foreignId('source_line_id')->nullable()->constrained('document_lines')->restrictOnDelete();
            $t->string('grade')->default('');
            $t->decimal('quantity', 20, 8)->nullable();
            $t->decimal('bags', 20, 8)->nullable();
            $t->decimal('price', 24, 8)->default(0);
            $t->decimal('gross', 24, 2)->default(0);
            $t->decimal('net', 24, 2)->default(0);
            $t->decimal('paid', 24, 2)->default(0);
            $t->decimal('dispatched', 20, 8)->default(0);
            $t->string('price_basis', 30)->nullable();
            $t->string('ownership', 20)->nullable();
            $t->json('details')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_lines');
    }
};
