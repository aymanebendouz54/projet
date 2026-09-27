<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Traffic;
use App\Models\Lane;

class TrafficSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Casablanca - Zerktouni
        $t1 = Traffic::create([
            'name' => 'Casablanca - Zerktouni / Roudani',
            'city' => 'Casablanca',
            'lat' => 33.5855,
            'lng' => -7.6255,
            'density' => 92,
            'status' => 'Critique'
        ]);

        $lanes = [
            ['direction_name' => 'Bd. Zerktouni Nord', 'density' => 95, 'light_status' => 'red'],
            ['direction_name' => 'Bd. Zerktouni Sud', 'density' => 88, 'light_status' => 'red'],
            ['direction_name' => 'Bd. Brahim Roudani', 'density' => 40, 'light_status' => 'green'],
            ['direction_name' => 'Av. Hassan II', 'density' => 30, 'light_status' => 'green'],
        ];

        foreach ($lanes as $l) {
            Lane::create(array_merge($l, ['traffic_id' => $t1->id]));
        }

        // 2. Meknès - Bab Mansour
        $t2 = Traffic::create([
            'name' => 'Meknès - Bab Mansour',
            'city' => 'Meknès',
            'lat' => 33.89325,
            'lng' => -5.56567,
            'density' => 92,
            'status' => 'Critique'
        ]);

        $lanes2 = [
            ['direction_name' => 'Place El Hedim', 'density' => 95, 'light_status' => 'red'],
            ['direction_name' => 'Rue de la Marche Verte', 'density' => 40, 'light_status' => 'green'],
            ['direction_name' => 'Bd. Mohammed V', 'density' => 30, 'light_status' => 'green'],
            ['direction_name' => 'Av. Moulay Ismaïl', 'density' => 85, 'light_status' => 'red'],
        ];

        foreach ($lanes2 as $l) {
            Lane::create(array_merge($l, ['traffic_id' => $t2->id]));
        }

        // 3. Rabat - Agdal
        $t3 = Traffic::create([
            'name' => 'Rabat - Agdal (France/Oumeir)',
            'city' => 'Rabat',
            'lat' => 33.9982,
            'lng' => -6.8475,
            'density' => 94,
            'status' => 'Critique'
        ]);

        $lanes3 = [
            ['direction_name' => 'Av. Fal Ould Oumeir', 'density' => 96, 'light_status' => 'red'],
            ['direction_name' => 'Av. de France', 'density' => 92, 'light_status' => 'red'],
            ['direction_name' => 'Rue Oukaimeden', 'density' => 50, 'light_status' => 'green'],
            ['direction_name' => 'Rue Aguelmane', 'density' => 45, 'light_status' => 'green'],
        ];

        foreach ($lanes3 as $l) {
            Lane::create(array_merge($l, ['traffic_id' => $t3->id]));
        }
    }
}
