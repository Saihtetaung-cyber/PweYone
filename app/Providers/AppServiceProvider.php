<?php

namespace App\Providers;

use App\Models\User;
use App\Support\AccountRecovery;
use Illuminate\Console\Events\CommandFinished;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Database\Events\DatabaseRefreshed;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $saveAccounts = function (User $user): void {
            if (app(AccountRecovery::class)->enabled()) {
                $connection = $user->getConnectionName();
                DB::connection($connection)->afterCommit(fn () => app(AccountRecovery::class)->backup($connection));
            }
        };
        User::saved($saveAccounts);
        User::deleted($saveAccounts);
        Event::listen(CommandStarting::class, function (CommandStarting $event): void {
            if ($event->command === 'migrate:fresh') {
                app(AccountRecovery::class)->backup($event->input->getOption('database'));
            }
        });
        Event::listen(CommandFinished::class, function (CommandFinished $event): void {
            if ($event->input->hasOption('pretend') && $event->input->getOption('pretend')) {
                return;
            }
            if ($event->exitCode === 0 && in_array($event->command, ['migrate', 'migrate:fresh'], true)) {
                $connection = $event->input->getOption('database');
                app(AccountRecovery::class)->restore($connection);
                $this->initializeWorkspace($connection);
            }
        });
        Event::listen(DatabaseRefreshed::class, function (DatabaseRefreshed $event): void {
            app(AccountRecovery::class)->restore($event->database);
            $this->initializeWorkspace($event->database);
        });
    }

    private function initializeWorkspace(?string $connection): void
    {
        if (config('workspace.auto_initialize') && Artisan::call('pweyon:install', ['--database' => $connection, '--if-needed' => true]) !== 0) {
            throw new \RuntimeException('Workspace initialization failed after migration.');
        }
    }
}
