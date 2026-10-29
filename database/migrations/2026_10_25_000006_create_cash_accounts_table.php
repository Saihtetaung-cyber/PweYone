<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_accounts', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->string('code')->unique();
            $t->string('name')->unique();
            $t->string('type', 20);
            $t->boolean('staff_can_view')->default(false);
            $t->boolean('active')->default(true);
            $t->decimal('opening_balance', 24, 2)->default(0);
            $t->decimal('balance', 24, 2)->default(0);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_accounts');
    }
};
