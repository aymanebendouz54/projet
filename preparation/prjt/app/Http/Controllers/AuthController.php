<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            \Illuminate\Support\Facades\Log::error("Login failed: User not found - " . $request->email);
            return response()->json(['message' => 'Utilisateur non trouvé'], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            \Illuminate\Support\Facades\Log::error("Login failed: Wrong password for - " . $request->email);
            return response()->json(['message' => 'Mot de passe incorrect'], 401);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }
}
