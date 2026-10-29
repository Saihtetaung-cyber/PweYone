<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_days', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->date('business_date')->unique();
            $t->string('status', 20)->default('open');
            $t->boolean('opening_checked')->default(false);
            $t->decimal('opening_expected', 24, 2)->default(0);
            $t->decimal('opening_actual', 24, 2)->nullable();
            $t->text('opening_note')->nullable();
            $t->json('closing')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_days');
    }
};
