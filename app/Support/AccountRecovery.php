<?php

namespace App\Support;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

final class AccountRecovery
{
    public function enabled(): bool
    {
        return (bool) config('account_recovery.enabled');
    }

    private function identity(?string $connection): string
    {
        $db = DB::connection($connection);

        return hash('sha256', json_encode([$db->getDriverName(), $db->getConfig('host'), $db->getConfig('port'), $db->getDatabaseName()], JSON_THROW_ON_ERROR));
    }

    public function path(?string $connection = null): string
    {
        return config('account_recovery.directory').'/'.$this->identity($connection).'.enc';
    }

    public function backup(?string $connection = null): int
    {
        if (! $this->enabled() || ! Schema::connection($connection)->hasColumn('users', 'owner_view_password')) {
            return 0;
        }
        $path = $this->path($connection);
        File::ensureDirectoryExists(dirname($path), 0700);
        $lock = fopen($path.'.lock', 'c');
        if (! $lock || ! flock($lock, LOCK_EX)) {
            throw new RuntimeException('Cannot lock account recovery backup.');
        }
        try {
            $rows = DB::connection($connection)->table('users')->orderBy('id')->get(['id', 'name', 'email', 'email_verified_at', 'password', 'owner_view_password', 'role', 'active', 'created_at', 'updated_at'])->map(fn ($user) => (array) $user)->all();
            if (! $rows) {
                return 0;
            }
            $encrypted = Crypt::encryptString(json_encode(['schema' => 1, 'database' => $this->identity($connection), 'users' => $rows], JSON_THROW_ON_ERROR));
            $temp = tempnam(dirname($path), 'accounts-');
            if ($temp === false || file_put_contents($temp, $encrypted, LOCK_EX) === false || ! rename($temp, $path)) {
                throw new RuntimeException('Cannot save account recovery backup; migration must not erase the accounts.');
            }
            chmod($path, 0600);

            return count($rows);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    public function restore(?string $connection = null): int
    {
        if (! $this->enabled() || ! Schema::connection($connection)->hasColumn('users', 'owner_view_password') || ! is_file($this->path($connection))) {
            return 0;
        }
        $db = DB::connection($connection);
        if ($db->table('users')->exists()) {
            return 0;
        }
        $payload = json_decode(Crypt::decryptString(File::get($this->path($connection))), true, 512, JSON_THROW_ON_ERROR);
        if (($payload['schema'] ?? null) !== 1 || ($payload['database'] ?? null) !== $this->identity($connection) || empty($payload['users'])) {
            throw new RuntimeException('Account recovery backup does not match this database.');
        }

        return $db->transaction(function () use ($db, $payload): int {
            if ($db->table('users')->exists()) {
                return 0;
            }
            $db->table('users')->insert($payload['users']);

            return count($payload['users']);
        });
    }
}
