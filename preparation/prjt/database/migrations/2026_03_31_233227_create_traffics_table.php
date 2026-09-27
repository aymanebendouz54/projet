<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('traffics', function (Blueprint $table) {
        $table->id();
        $table->string('name'); 
        $table->string('city')->nullable(); // Zid hada l'filtre dyal l'zones
        $table->decimal('lat', 10, 8); 
        $table->decimal('lng', 11, 8); 
        $table->integer('density'); 
        $table->string('status')->default('Normal'); 
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traffics');
    }
};
