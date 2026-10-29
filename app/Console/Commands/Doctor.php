<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class Doctor extends Command
{
    protected $signature = 'pweyon:doctor';

    protected $description = 'Show runtime and schema diagnostics without credentials or business balances';

    public function handle(): int
    {
        $this->line('Laravel '.app()->version().' | PHP '.PHP_VERSION);
        $this->line('Database driver: '.DB::connection()->getDriverName());
        $this->line('Database name: '.DB::connection()->getDatabaseName());
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return self::FAILURE;
        }
        $this->line('Server: '.DB::selectOne('SELECT VERSION() AS version')->version);
        $this->line('Applied migrations: '.DB::table('migrations')->count());
        $this->line('Business table engines: '.implode(', ', array_unique(array_map(fn ($r) => $r->ENGINE, DB::select('SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (\'stock_lots\',\'documents\',\'cash_accounts\',\'payments\')')))));

        return self::SUCCESS;
    }
}
