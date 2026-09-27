<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@smarttraffic.ma'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'), // Beddel had l-password men b3d
            ]
        );
    }
}
