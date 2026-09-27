<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TrafficController;
use App\Http\Controllers\AuthController;
use App\Models\Traffic;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/force-reset', function() {
    $user = \App\Models\User::where('email', 'admin@smarttraffic.ma')->first();
    if ($user) {
        $user->password = \Illuminate\Support\Facades\Hash::make('password');
        $user->save();
        return "Password reset to 'password' for admin@smarttraffic.ma";
    }
    return "User not found";
});
Route::get('/check-tables', function() {
    return [
        'users' => \Illuminate\Support\Facades\Schema::hasTable('users'),
        'personal_access_tokens' => \Illuminate\Support\Facades\Schema::hasTable('personal_access_tokens'),
        'optimizations' => \Illuminate\Support\Facades\Schema::hasTable('optimizations'),
    ];
});
Route::get('/debug-users', function() {
    return response()->json(\App\Models\User::all());
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/optimize/{id}', [TrafficController::class, 'optimize']);
});


Route::get('/zones/{city}', [TrafficController::class, 'getZones']);
Route::post('/compare-traffic', [TrafficController::class, 'compare']);
Route::get('/all-zones', [TrafficController::class, 'getAllZones']);
Route::get('/traffic-data', [TrafficController::class, 'getTrafficData']);
Route::post('/update-traffic', [TrafficController::class, 'updateTraffic']); // Bach n-modifiw data men b3d
Route::get('/traffic-data', function () {
    $data = Traffic::all();
    // Zid had l-log bach t-chouf f l-terminal dyal Laravel wach l-data kat-khrej
    error_log("Data fetched: " . count($data)); 
    return response()->json($data);
});
Route::post('/process-traffic', [TrafficController::class, 'processAI']);