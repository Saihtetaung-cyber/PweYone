<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recoveries', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('source_document_id')->constrained('documents')->restrictOnDelete();
            $t->foreignId('target_document_id')->constrained('documents')->restrictOnDelete();
            $t->string('kind', 30);
            $t->decimal('amount', 24, 2);
            $t->date('business_date');
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recoveries');
    }
};
