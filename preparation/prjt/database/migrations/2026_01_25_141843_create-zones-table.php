<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('zones', function (Blueprint $table) {
        $table->id();
        $table->string('city');
        $table->string('name');
        $table->integer('vehicle_count')->default(0);
        $table->string('status')->default('Done');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
