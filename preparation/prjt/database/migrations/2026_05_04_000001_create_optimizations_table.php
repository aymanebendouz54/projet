<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('optimizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('traffic_id')->constrained('traffics')->onDelete('cascade');
            $table->string('admin_name')->default('Administrator');
            $table->string('action_taken')->default('Force Green');
            $table->integer('density_before')->nullable();
            $table->integer('density_after')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('optimizations');
    }
};
