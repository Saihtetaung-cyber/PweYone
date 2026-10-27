<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_lots', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('receipt_line_id')->nullable()->constrained('document_lines')->restrictOnDelete();
            $t->foreignId('sale_line_id')->nullable()->constrained('document_lines')->restrictOnDelete();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->foreignId('warehouse_id')->constrained()->restrictOnDelete();
            $t->foreignId('party_id')->nullable()->constrained('partners')->restrictOnDelete();
            $t->foreignId('parent_lot_id')->nullable()->constrained('stock_lots')->restrictOnDelete();
            $t->foreignId('package_type_id')->nullable()->constrained('package_types')->restrictOnDelete();
            $t->string('owner', 20)->index();
            $t->string('grade')->default('');
            $t->string('batch');
            $t->decimal('quantity', 20, 8)->nullable();
            $t->decimal('bags', 20, 8)->nullable();
            $t->decimal('package_viss', 20, 8)->nullable();
            $t->decimal('unit_cost', 24, 8)->default(0);
            $t->string('stock_form', 20)->default('loose');
            $t->date('entry_date');
            $t->index(['receipt_line_id', 'owner']);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_lots');
    }
};
