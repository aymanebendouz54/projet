<?php

namespace App\Models;




use Illuminate\Database\Eloquent\Model;

class Traffic extends Model
{
    protected $table = 'traffics';
    protected $fillable = ['name', 'city', 'lat', 'lng', 'density', 'status'];

    public function lanes()
    {
        return $this->hasMany(Lane::class);
    }
}