<?php

namespace Database\Seeders;

use App\Support\AccountRecovery;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app(AccountRecovery::class)->restore();
        $this->call(DefaultAccountSeeder::class);
        if (config('workspace.auto_initialize') && Artisan::call('pweyon:install', ['--if-needed' => true]) !== 0) {
            throw new \RuntimeException('Workspace initialization failed while seeding.');
        }
        app(AccountRecovery::class)->backup();
    }
}
