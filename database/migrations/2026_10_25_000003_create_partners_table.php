<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->string('name');
            $t->string('locality')->default('');
            $t->string('phone')->default('');
            $t->string('kind', 20);
            $t->boolean('active')->default(true);
            $t->json('details')->nullable();
            $t->index(['kind', 'active']);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
