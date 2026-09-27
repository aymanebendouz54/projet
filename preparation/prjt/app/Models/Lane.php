<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lane extends Model
{
    use HasFactory;

    protected $fillable = [
        'traffic_id',
        'direction_name',
        'stream_url',
        'density',
        'light_status',
        'is_problematic'
    ];

    public function traffic()
    {
        return $this->belongsTo(Traffic::class);
    }
}
