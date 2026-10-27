<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_prices', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->string('grade');
            $t->date('business_date');
            $t->decimal('price', 24, 8);
            $t->unique(['product_id', 'grade', 'business_date']);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_prices');
    }
};
