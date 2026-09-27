<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lanes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('traffic_id')->constrained('traffics')->onDelete('cascade');
            $table->string('direction_name'); // Smya dyal l'voie
            $table->string('stream_url')->nullable(); // Link dyal l'camera
            $table->integer('density')->default(0);
            $table->string('light_status')->default('red'); // red, green, yellow
            $table->boolean('is_problematic')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lanes');
    }
};
