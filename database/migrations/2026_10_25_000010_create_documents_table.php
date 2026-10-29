<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $t) {
            $t->engine = 'InnoDB';
            $t->id();
            $t->string('kind', 30)->index();
            $t->string('number')->unique();
            $t->string('status', 30);
            $t->date('business_date')->index();
            $t->foreignId('party_id')->nullable()->constrained('partners')->restrictOnDelete();
            $t->foreignId('source_document_id')->nullable()->constrained('documents')->restrictOnDelete();
            $t->decimal('gross', 24, 2)->default(0);
            $t->decimal('net', 24, 2)->default(0);
            $t->decimal('paid', 24, 2)->default(0);
            $t->string('vehicle')->nullable();
            $t->text('note')->nullable();
            $t->json('details')->nullable();
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
