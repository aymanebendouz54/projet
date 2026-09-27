<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Optimization extends Model
{
    use HasFactory;

    protected $fillable = [
        'traffic_id',
        'admin_name',
        'action_taken',
        'density_before',
        'density_after',
        'notes',
    ];

    public function traffic()
    {
        return $this->belongsTo(Traffic::class);
    }
}
