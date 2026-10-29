<?php

namespace Tests\Feature;

use App\Http\WorkspaceAccess;
use App\Models\User;
use App\Support\AccountRecovery;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountRecoveryTest extends TestCase
{
    public function test_fresh_restores_latest_separate_credentials_without_seed_or_plaintext_backup(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true) || DB::connection()->getDatabaseName() !== 'pweyon_test' || DB::table('users')->exists()) {
            throw new \RuntimeException('Recovery rehearsal requires the empty dedicated pweyon_test database.');
        }
        $directory = storage_path('framework/testing/account-recovery-'.Str::uuid());
        config(['account_recovery.enabled' => true, 'account_recovery.directory' => $directory, 'workspace.auto_initialize' => true]);
        $this->app->make(Kernel::class)->rerouteSymfonyCommandEvents();
        try {
            $owner = User::factory()->create(['role' => 'owner', 'email' => 'recovery@example.test', 'password' => 'Initial-login!123', 'owner_view_password' => 'Initial-owner!123']);
            $clerk = User::factory()->create(['role' => 'clerk', 'active' => false]);
            $recovery = app(AccountRecovery::class);
            $this->assertFileExists($recovery->path());
            $this->actingAs($owner)->withSession([WorkspaceAccess::SESSION_KEY => 'owner'])
                ->postJson('/api/account', ['email' => 'updated@example.test', 'password' => 'Updated-login!123'])->assertOk();
            $this->postJson('/api/account/owner-password', ['owner_view_password' => 'Updated-owner!123'])->assertOk();
            $encrypted = File::get($recovery->path());
            $this->assertStringNotContainsString('updated@example.test', $encrypted);
            $this->assertStringNotContainsString('Updated-login!123', $encrypted);
            $payload = json_decode(Crypt::decryptString($encrypted), true, 512, JSON_THROW_ON_ERROR);
            $savedOwner = collect($payload['users'])->firstWhere('role', 'owner');
            $this->assertTrue(Hash::check('Updated-login!123', $savedOwner['password']));
            $this->assertTrue(Hash::check('Updated-owner!123', $savedOwner['owner_view_password']));
            $this->assertStringNotContainsString($savedOwner['password'], $encrypted);
            $this->assertArrayNotHasKey('remember_token', $savedOwner);
            DB::beginTransaction();
            $rolledBack = $owner->fresh();
            $rolledBack->email = 'rolled-back@example.test';
            $rolledBack->save();
            DB::rollBack();
            $this->assertSame($encrypted, File::get($recovery->path()));

            $this->artisan('migrate:fresh', ['--force' => true])->assertSuccessful();
            $restored = User::findOrFail($owner->id);
            $this->assertSame('updated@example.test', $restored->email);
            $this->assertTrue(Hash::check('Updated-login!123', $restored->password));
            $this->assertTrue(Hash::check('Updated-owner!123', $restored->owner_view_password));
            $this->assertFalse(User::findOrFail($clerk->id)->active);
            $this->assertSame(2, User::count());
            $this->assertSame(0, $recovery->restore());
            $this->assertSame(1, DB::table('operation_locks')->where('name', 'workspace')->count());
            $this->assertSame(1, DB::table('business_days')->count());
            $this->assertSame(5, DB::table('cash_accounts')->count());
            $this->assertSame(0.0, (float) DB::table('cash_accounts')->sum('balance'));
            $this->postJson('/api/commands', ['action' => 'master.save', 'input' => ['kind' => 'warehouse', 'data' => ['name' => 'Post-reset warehouse', 'active' => true]]], ['Idempotency-Key' => (string) Str::uuid()])->assertOk();
            $this->assertTrue(DB::table('warehouses')->where('name', 'Post-reset warehouse')->exists());
            DB::table('cash_accounts')->where('code', 'cash')->update(['balance' => '123']);
            DB::table('labor_rates')->delete();
            $day = DB::table('business_days')->value('business_date');
            $this->artisan('migrate', ['--force' => true])->assertSuccessful();
            $this->assertSame(123.0, (float) DB::table('cash_accounts')->where('code', 'cash')->value('balance'));
            $this->assertSame(0, DB::table('labor_rates')->count());
            $this->assertSame($day, DB::table('business_days')->value('business_date'));
            $this->artisan('db:seed', ['--force' => true])->assertSuccessful();
            $this->assertSame(3, User::count());
            $this->assertTrue(User::where('email', 'owner@pweyon.local')->exists());
            $this->assertSame(0, DB::table('labor_rates')->count());
            $this->post('/logout')->assertRedirect('/login');
            $this->post('/login', ['email' => 'updated@example.test', 'password' => 'Updated-login!123'])->assertRedirect('/');
            $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'Updated-login!123'])->assertUnprocessable();
            $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'Updated-owner!123'])->assertOk();
            $this->artisan('migrate:fresh', ['--seed' => true, '--force' => true])->assertSuccessful();
            $this->assertSame('updated@example.test', User::findOrFail($owner->id)->email);
            $this->assertTrue(Hash::check('Updated-owner!123', User::findOrFail($owner->id)->owner_view_password));
            $this->assertSame(3, User::count());
            $this->assertSame(1, DB::table('operation_locks')->where('name', 'workspace')->count());
            $this->assertSame(1, DB::table('business_days')->count());
        } finally {
            config(['account_recovery.enabled' => false, 'workspace.auto_initialize' => false]);
            $this->artisan('migrate:fresh', ['--force' => true])->assertSuccessful();
            File::deleteDirectory($directory);
        }
    }
}
