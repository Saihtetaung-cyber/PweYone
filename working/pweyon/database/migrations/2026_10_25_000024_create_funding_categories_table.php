<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funding_categories', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->string('code')->unique();
            $t->string('name');
            $t->string('type', 20);
            $t->boolean('active')->default(true);
            $t->boolean('locked')->default(false);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funding_categories');
    }
};
