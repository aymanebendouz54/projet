<?php
namespace App\Http\Controllers;

use App\Models\Traffic;
use App\Models\Optimization;
use Illuminate\Http\Request;

class TrafficController extends Controller
{
    public function getTrafficData()
    {
        // Jib kolchi men l-base de données avec les lanes (cameras)
        return response()->json(Traffic::with('lanes')->get());
    }
    public function processAI(Request $request) 
{
    $request->validate(['image' => 'required|image']);

    // 1. Savy l-photo temporairement
    $path = $request->file('image')->path();

    try {
        // 2. Appeler le service AI (FastAPI sur port 8001)
        $response = \Illuminate\Support\Facades\Http::attach(
            'file', file_get_contents($path), 'image.jpg'
        )->post('http://127.0.0.1:8001/detect');

        if ($response->successful()) {
            $carCount = $response->json()['count'];
            return response()->json([
                'car_count' => $carCount,
                'density_status' => $carCount > 30 ? 'Heavy' : 'Normal',
                'message' => 'YOLO Analysis Complete via FastAPI'
            ]);
        }
    } catch (\Exception $e) {
        return response()->json(['error' => 'AI Service unreachable'], 500);
    }

    return response()->json(['error' => 'AI Processing failed'], 500);
}

    public function updateTraffic(Request $request)
    {
        // Had l-function hiya li ghadi i-welli i-3yt liha Python (YOLO)
        $traffic = Traffics::updateOrCreate(
            ['intersection_name' => $request->name],
            [
                'lat' => $request->lat,
                'lng' => $request->lng,
                'density' => $request->density,
                'status' => $request->status
            ]
        );
        return response()->json($traffic);
    }
    public function optimize($id)
    {
        $traffic = Traffic::find($id);
        if (!$traffic) return response()->json(['error' => 'Not found'], 404);

        $densityBefore = $traffic->density;

        // Update all lanes to green and reduce density
        foreach ($traffic->lanes as $lane) {
            $lane->update([
                'light_status' => 'green',
                'density' => 10,
                'is_problematic' => false
            ]);
        }

        $traffic->update([
            'density' => 10,
            'status' => 'Optimisé'
        ]);

        // Sijjel l'Historique
        Optimization::create([
            'traffic_id' => $id,
            'admin_name' => 'Admin (Web Dashboard)',
            'action_taken' => 'IA Global Optimization',
            'density_before' => $densityBefore,
            'density_after' => 10,
            'notes' => 'Optimisation manuelle déclenchée via le Dashboard React.'
        ]);

        return response()->json(['message' => 'Optimization successful and logged']);
    }
}