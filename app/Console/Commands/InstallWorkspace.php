<?php

namespace App\Console\Commands;

use App\Domain\Records as R;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class InstallWorkspace extends Command
{
    protected $signature = 'pweyon:install {--database= : Database connection to initialize} {--if-needed : Skip an already initialized workspace}';

    protected $description = 'Initialize empty MySQL or MariaDB workspace settings without business sample data';

    public function handle(): int
    {
        return DB::usingConnection($this->option('database') ?: config('database.default'), fn () => $this->installWorkspace());
    }

    private function installWorkspace(): int
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $this->error('MySQL or MariaDB is required.');

            return self::FAILURE;
        }
        $version = DB::selectOne('SELECT VERSION() AS v')->v;
        if (str_contains(strtolower($version), 'mariadb') && version_compare($version, '10.11.0', '<')) {
            $this->error('MariaDB 10.11 or later is required.');

            return self::FAILURE;
        }
        if ($this->option('if-needed') && DB::table('operation_locks')->where('name', 'workspace')->exists() && DB::table('business_days')->exists()) {
            $this->info('Workspace is already initialized; existing settings preserved.');

            return self::SUCCESS;
        }
        DB::transaction(function () {
            DB::table('operation_locks')->insertOrIgnore(['name' => 'workspace', 'created_at' => now(), 'updated_at' => now()]);
            DB::table('operation_locks')->where('name', 'workspace')->lockForUpdate()->first();
            if (! DB::table('business_days')->exists()) {
                R::insert('business_days', ['business_date' => now('Asia/Yangon')->toDateString()]);
            }
            foreach ([['cash', 'ပွဲရုံ ငွေသား', 'cash', true], ['bank', 'ဘဏ် (မူလအကောင့်)', 'bank', true], ['home', 'အိမ် ငွေသိမ်းရာ', 'home', false], ['kpay', 'KBZ Pay', 'wallet', true], ['wave', 'Wave Money', 'wallet', true]] as [$code,$name,$type,$visible]) {
                if (! DB::table('cash_accounts')->where('code', $code)->exists()) {
                    R::insert('cash_accounts', ['code' => $code, 'name' => $name, 'type' => $type, 'staff_can_view' => $visible]);
                }
            }
            if (! DB::table('warehouses')->exists()) {
                R::insert('warehouses', ['name' => 'ပင်မဂိုဒေါင်']);
            }
            if (! DB::table('labor_rates')->where('kind', 'mael')->where('rate', '1')->exists()) {
                R::insert('labor_rates', ['name' => '1 မယ် — တစ်ပိုင်း တစ်ခါကိုင်', 'kind' => 'mael', 'rate' => '1']);
            }
            foreach ([['3101', 'ပိုင်ရှင်ထည့်ဝင်ငွေ (Owner Capital)', 'equity'], ['2101', 'ပိုင်ရှင်ချေးငွေ (Owner Loan)', 'liability'], ['2102', 'ပြင်ပချေးငွေ (External Loan)', 'liability'], ['3901', 'အခြားငွေဖြည့်သွင်းမှု (Other Funding)', 'other'], ['1901', 'ငွေသိမ်းရာအချင်းချင်း လွှဲပြောင်းခြင်း (Internal Transfer)', 'transfer']] as [$code,$name,$type]) {
                if (! DB::table('funding_categories')->where('code', $code)->exists()) {
                    R::insert('funding_categories', ['code' => $code, 'name' => $name, 'type' => $type, 'locked' => true]);
                }
            }
        });
        $this->info('Workspace initialized without users, balances or sample transactions.');

        return self::SUCCESS;
    }
}
