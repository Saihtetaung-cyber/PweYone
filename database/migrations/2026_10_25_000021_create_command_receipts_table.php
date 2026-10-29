<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('command_receipts', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $t->uuid('request_key');
            $t->string('intent_hash', 64);
            $t->json('result');
            $t->unique(['actor_id', 'request_key']);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('command_receipts');
    }
};
