<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $owner = User::query()->firstOrNew(['email' => 'owner@pweyon.local']);
        if ($owner->exists) {
            return;
        }

        $owner->forceFill([
            'name' => 'PweYon Owner',
            'password' => 'Pweyon@123456',
            'owner_view_password' => 'Owner@123456',
            'role' => 'owner',
            'active' => true,
        ])->save();
    }
}
