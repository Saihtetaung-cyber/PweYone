<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->date('business_date');
            $t->string('action');
            $t->foreignId('document_id')->nullable()->constrained()->restrictOnDelete();
            $t->json('details');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
