<?php

// Disposable browser fixtures only; never loads the application database environment.
use App\Domain\Records as R;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require dirname(__DIR__, 2).'/working/pweyon/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/working/pweyon/bootstrap/app.php';
$app->loadEnvironmentFrom('.env.testing');
$app->make(Kernel::class)->bootstrap();
if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true) || DB::connection()->getDatabaseName() !== 'pweyon_test') {
    throw new RuntimeException('Browser fixtures require the dedicated MySQL/MariaDB pweyon_test database.');
}
$path = dirname(__DIR__, 2).'/development/runtime/browser-fixture.json';
$tables = ['command_receipts', 'audit_logs', 'recoveries', 'payment_allocations', 'payments', 'stock_checks', 'stock_events', 'cash_entries', 'stock_lots', 'document_lines', 'documents', 'daily_prices', 'package_types', 'cash_accounts', 'warehouses', 'products', 'partners', 'business_days', 'operation_locks', 'funding_categories', 'labor_rates', 'adjustment_rates', 'expense_reasons', 'business_settings', 'users'];
if (($argv[1] ?? '') === 'environment') {
    $environment = file_get_contents(dirname(__DIR__, 2).'/working/pweyon/.env.testing');
    $environment = preg_replace('/^APP_ENV=.*$/m', 'APP_ENV=browser', $environment);
    file_put_contents(dirname(__DIR__, 2).'/working/pweyon/.env.browser', $environment);
    echo "Private browser environment uses the test database with real HTTP middleware.\n";
    exit;
}
if (($argv[1] ?? '') === 'cleanup') {
    $fixture = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    $emails = DB::table('users')->pluck('email')->sort()->values()->all();
    $expected = [$fixture['owner']['email'], $fixture['clerk']['email']];
    sort($expected);
    if ($emails !== $expected) {
        throw new RuntimeException('Unexpected test users; refusing cleanup.');
    }
    DB::transaction(function () use ($tables, $fixture) {
        DB::table('loan_interest_policies')->whereNotIn('id', $fixture['loanPolicyIds'])->delete();
        foreach ($tables as $table) {
            foreach (DB::table($table)->orderByDesc('id')->get() as $row) {
                DB::table($table)->where('id', $row->id)->delete();
            }
        }
    });
    unlink($path);
    echo "Disposable browser fixtures removed; foreign keys remained enabled.\n";
    exit;
}
foreach ($tables as $table) {
    if (DB::table($table)->exists()) {
        throw new RuntimeException('Browser setup requires an empty disposable test database: '.$table);
    }
}
$withoutFixedMael = ($argv[1] ?? '') === 'two-mael';
$fixture = DB::transaction(function () use ($withoutFixedMael) {
    $password = Str::random(32);
    $owner = new User(['name' => 'Browser Owner', 'email' => 'browser-owner@example.test', 'password' => $password]);
    $owner->role = 'owner';
    $owner->save();
    $clerk = new User(['name' => 'Browser Clerk', 'email' => 'browser-clerk@example.test', 'password' => $password]);
    $clerk->role = 'clerk';
    $clerk->save();
    R::insert('operation_locks', ['name' => 'workspace']);
    R::insert('business_days', ['business_date' => '2026-10-25', 'opening_checked' => true]);
    $trader = R::insert('partners', ['name' => 'Browser Trader', 'locality' => 'Town', 'kind' => 'supplier']);
    $buyer = R::insert('partners', ['name' => 'Browser Buyer', 'locality' => 'Town', 'kind' => 'buyer']);
    $product = R::insert('products', ['name' => 'Browser Sesame', 'grades' => ['A'], 'standard_viss' => '25']);
    $warehouse = R::insert('warehouses', ['name' => 'Browser Main']);
    R::insert('cash_accounts', ['code' => 'cash', 'name' => 'Cash', 'type' => 'cash', 'staff_can_view' => true, 'opening_balance' => '2000000', 'balance' => '2000000']);
    R::insert('cash_accounts', ['code' => 'home', 'name' => 'Home', 'type' => 'home', 'staff_can_view' => false, 'opening_balance' => '500000', 'balance' => '500000']);
    R::insert('labor_rates', ['name' => $withoutFixedMael ? 'Two handling' : 'One handling', 'kind' => 'mael', 'rate' => $withoutFixedMael ? '2' : '1']);

    return ['loanPolicyIds' => DB::table('loan_interest_policies')->pluck('id')->all(), 'owner' => ['email' => $owner->email, 'password' => $password], 'clerk' => ['email' => $clerk->email, 'password' => $password], 'trader' => (string) $trader->id, 'buyer' => (string) $buyer->id, 'product' => $product->name, 'warehouse' => (string) $warehouse->id];
});
file_put_contents($path, json_encode($fixture, JSON_THROW_ON_ERROR));
echo "Disposable browser fixtures ready; private credentials stored only under ignored runtime.\n";
