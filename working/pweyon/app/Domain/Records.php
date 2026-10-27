<?php

namespace App\Domain;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class Records
{
    public static function insert(string $table, array $values): object
    {
        foreach ($values as $key => $value) {
            if (is_array($value)) {
                $values[$key] = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            }
        }
        $id = DB::table($table)->insertGetId($values + ['created_at' => now(), 'updated_at' => now()]);

        return DB::table($table)->find($id);
    }

    public static function update(string $table, int $id, array $values): object
    {
        foreach ($values as $key => $value) {
            if (is_array($value)) {
                $values[$key] = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            }
        }
        DB::table($table)->where('id', $id)->update($values + ['updated_at' => now()]);

        return DB::table($table)->find($id);
    }

    public static function get(string $table, mixed $id): object
    {
        $record = DB::table($table)->find($id);
        if (! $record) {
            throw ValidationException::withMessages(['record' => 'Record no longer exists. Refresh and retry.']);
        }

        return $record;
    }

    public static function details(object $record): array
    {
        return json_decode($record->details ?? '{}', true, 512, JSON_THROW_ON_ERROR);
    }

    public static function require(bool $condition, string $message, string $field = 'operation'): void
    {
        if (! $condition) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
