<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

final class CreateUser extends Command
{
    protected $signature = 'pweyon:user {--role=owner : owner or clerk}';

    protected $description = 'Create an owner or clerk using a private interactive password';

    public function handle(): int
    {
        $role = $this->option('role');
        if (! in_array($role, ['owner', 'clerk'], true)) {
            $this->error('Use owner or clerk.');

            return self::FAILURE;
        }
        $name = $this->ask('Name');
        $email = $this->ask('Email');
        $password = $this->secret('Password (at least 12 characters)');
        $confirmation = $this->secret('Confirm password');
        $v = Validator::make(['name' => $name, 'email' => $email, 'password' => $password, 'password_confirmation' => $confirmation], ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'unique:users'], 'password' => ['required', 'confirmed', Password::min(12)]]);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $m) {
                $this->error($m);
            }

            return self::FAILURE;
        }
        $u = new User;
        $u->name = $name;
        $u->email = $email;
        $u->password = $password;
        $u->role = $role;
        $u->active = true;
        $u->save();
        $this->info('User created.');

        return self::SUCCESS;
    }
}
