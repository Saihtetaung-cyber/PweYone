<?php

namespace App\Domain;

use Illuminate\Validation\ValidationException;

final class Decimal
{
    public static function value(mixed $value, int $scale = 8, bool $negative = false): string
    {
        if (! is_string($value) && ! is_int($value)) {
            throw ValidationException::withMessages(['amount' => 'Send decimal amounts as strings.']);
        }
        $value = (string) $value;
        if (str_starts_with($value, '.')) {
            $value = '0'.$value;
        }
        if (str_starts_with($value, '-.')) {
            $value = '-0'.substr($value, 1);
        }
        if (! preg_match('/^'.($negative ? '-?' : '').'\d{1,14}(?:\.\d{1,'.$scale.'})?$/D', $value)) {
            throw ValidationException::withMessages(['amount' => 'Invalid amount or precision.']);
        }

        return bcadd($value, '0', $scale);
    }

    public static function add(string $a, string $b): string
    {
        return bcadd($a, $b, 8);
    }

    public static function sub(string $a, string $b): string
    {
        return bcsub($a, $b, 8);
    }

    public static function mul(string $a, string $b): string
    {
        return bcmul($a, $b, 8);
    }

    public static function div(string $a, string $b): string
    {
        return bcdiv($a, $b, 8);
    }

    public static function cmp(string $a, string $b): int
    {
        return bccomp($a, $b, 8);
    }

    public static function min(string $a, string $b): string
    {
        return self::cmp($a, $b) <= 0 ? $a : $b;
    }

    public static function money(string $a): string
    {
        return bcadd(bcadd($a, str_starts_with($a, '-') ? '-0.005' : '0.005', 8), '0', 2);
    }

    public static function kyat(string $a): string
    {
        return bcadd(bcadd($a, '0.5', 8), '0', 0);
    }

    public static function sum(iterable $values): string
    {
        $sum = '0';
        foreach ($values as $value) {
            $sum = self::add($sum, (string) $value);
        }

        return $sum;
    }
}
