<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adjustment_rates', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->string('name');
            $t->string('kind', 20);
            $t->string('item_type', 40);
            $t->string('calc_mode', 40);
            $t->decimal('rate', 20, 8)->default(0);
            $t->boolean('active')->default(true);
            $t->json('details')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adjustment_rates');
    }
};
