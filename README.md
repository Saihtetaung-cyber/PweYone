# PweYon

The running Laravel application is in [`working/pweyon`](working/pweyon). Original HTML/PDF references are under `reference/originals/`; extracted reference material is under `reference/extracted/`. Reusable development/test utilities are under `development/tools/`. Unneeded scaffold, completed one-time scripts, installer ZIP and generated temporary files were deleted at the user's request. Recovery backups remain under `archive/private/`. See the [Myanmar folder guide](docs/FOLDER_MAP_MM.md) and [file-by-file connection map](docs/FILE_CONNECTIONS.csv).

Implementation and verification are substantial but **full source parity and business UAT are not complete**. See [remaining work](docs/KNOWN_GAPS.md), the [implementation map](docs/IMPLEMENTATION_MAP.md), [verification](docs/TEST_RESULTS.md), and [resume checkpoint](docs/CHECKPOINT.md).

## Run in this workspace

The active database is **XAMPP MariaDB 10.11.16 at `127.0.0.1:3306`**, selected by the user on 2026-10-26. PHP 8.5.12, Composer 2.10.2 and Laravel 13.38.0 are used. Application database: `pweyon`; separate disposable test database: `pweyon_test`. Private restricted-user credentials are in ignored environment files. The application does not connect as root.

Start XAMPP's **MySQL** module (the XAMPP label for its MariaDB server). To inspect the database, open <http://localhost/phpmyadmin/> with XAMPP Apache running and select **pweyon**. `.env` now uses `DB_CONNECTION=mariadb` and `DB_PORT=3306`.

```powershell
Set-Location 'D:\Pwal Yone\working\pweyon'
php artisan pweyon:doctor
php artisan pweyon:user --role=owner
php artisan pweyon:user --role=clerk
php artisan serve --host=127.0.0.1 --port=8000
```

Open <http://127.0.0.1:8000>. The existing owner account and its password hash were preserved during the database move. The user-creation commands above are for additional accounts; they prompt privately for a password of at least 12 characters and its confirmation. No shared password is embedded in source. Every successful login starts in the clerk workspace, including owner accounts. Owner entry still requires the separate owner password. Logout and another login reset the workspace to clerk view. An authenticated owner can switch to the clerk workspace immediately. Returning from clerk view to owner view requires that owner's separate owner-entry password every time. In owner view, separate navigation items provide Login Email / Password settings and owner-entry password settings. Each accepts a new password once, without requesting the current password or confirmation. Blank login-password input preserves the login password; the owner-password form requires a new password. Each endpoint rejects fields belonging to the other setting. Existing owners retain their previous password for owner entry until they change it separately. The selected view is stored in the server session; clerk view receives clerk permissions and filtered account data, including after refresh. A real clerk account cannot promote itself. Five incorrect confirmation attempts trigger a short rate limit.

Account recovery is enabled outside testing/browser environments. Account changes save an encrypted copy of user identities, login-password hashes and separate owner-entry-password hashes under `working/pweyon/storage/app/private/account-recovery/`, scoped to the database. `php artisan migrate:fresh` backs up existing accounts before dropping tables and restores them after migrations, with or without `--seed`; existing users are never overwritten by recovery. `db:seed` can also restore into an empty users table. Keep this private folder and the same `.env` `APP_KEY`; removing them or changing the key prevents decryption. This preserves accounts only: `migrate:fresh` still deletes business records. After successful migrations or seeding, missing workspace initialization is now filled automatically through `pweyon:install --if-needed`, using the selected database connection. Already initialized workspaces retain their balances, business dates and intentionally deleted master rates. For manual repair, run `php artisan pweyon:install --if-needed`. This automation is disabled by default in testing/browser environments and on migration dry runs. Recovery is disabled in tests unless explicitly enabled with an isolated private directory.

The original MySQL 8.4.13 data directory under `archive/private/mysql-3307/mysql-data` and a SQL backup under `archive/private/` remain intact for recovery. That old port-3307 instance is no longer the active application database. Do not initialize its data directory. Completed provisioning scripts and the redundant installer ZIP were deleted during cleanup. The active MariaDB data stays in XAMPP's own data directory. See [the database move record](docs/MARIADB_SWITCH.md) for verification and recovery details.

## Set up another machine

Use PHP compatible with Laravel 13, including BCMath, PDO MySQL, Mbstring, XML, cURL, OpenSSL and the ordinary Laravel extensions. Composer needs ZIP support or a ZIP extraction executable. The HTML's scripts, styles and embedded font are served as static assets; no frontend build is required.

```powershell
Set-Location '<checkout>\working\pweyon'
composer install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env privately: MariaDB host, port, database, user and password.
php artisan key:generate
php artisan migrate
php artisan pweyon:install
php artisan pweyon:user --role=owner
php artisan pweyon:doctor
php artisan serve --host=127.0.0.1 --port=8000
```

On this XAMPP installation the ZIP DLL exists but is not enabled for ordinary CLI execution. The dependency installation equivalent is:

```powershell
php -d extension=zip C:\ProgramData\ComposerSetup\bin\composer.phar install
```

Provision an empty MariaDB 10.11+ database and its own private database user first. `.env.example` contains placeholders, never usable shared credentials. MySQL remains supported through Laravel's `mysql` driver; its original verification is separately preserved. `pweyon:install` creates zero-balance account definitions, the main warehouse, fixed one-mael reference and funding classifications. It does not create stock, financial balances, sample traders, users, loans or sales. Enter real opening balances through the application and owner approval.

For an existing data-bearing database, inventory and reconcile its schema and migration history before provisioning. The local 2026-10-26 move created the destination with real migrations, then copied and compared existing records. No existing XAMPP database was overwritten. Do not use `migrate:fresh` or manufacture migration history.

## Tests

Use a separate MariaDB/MySQL database named **`pweyon_test`**, with a test user restricted to that database. Copy `.env` to `.env.testing` privately and change the database, user and password; align the non-secret connection settings in `phpunit.xml`. Never use a shared database. The suite checks the exact database name and supported driver; MariaDB must be 10.11 or later. SQLite is rejected. Its concurrency test deletes its committed fixtures from this dedicated test database. The active test profile uses MariaDB on port 3306; its evidence is labeled MariaDB, not MySQL.

```powershell
php artisan migrate --env=testing
php artisan test
php vendor/bin/pint --test
```

Source-interface DOM contract checks use separate development tools at the workspace root:

```powershell
Set-Location '<checkout>\development\tools'
npm.cmd ci --no-fund --no-audit
Set-Location '../..'
node development/tools/build-interface.cjs
Push-Location 'working/pweyon'
php vendor/phpunit/phpunit/phpunit --filter 'original_interface|closing_snapshot|historical_today_purchase'
Pop-Location
node development/tools/test-interface.cjs
node development/tools/test-historical-interface.cjs
node development/tools/test-print-export.cjs
```

Those DOM checks deliberately simulate a rejected HTTP save. They verify payloads and retained form values; they are not full browser-to-database acceptance tests. Application integration tests execute real MariaDB/MySQL operations.

The real browser check uses the installed Edge executable and Playwright Core from `tools`. First ensure that `pweyon_test` is empty and no other tests are running:

```powershell
Set-Location '<checkout>'
php development/tools/browser-fixture.php environment
php development/tools/browser-fixture.php
# In a separate terminal, from working/pweyon:
php artisan serve --env=browser --host=127.0.0.1 --port=8001
# From the workspace root, after that server starts:
node development/tools/test-browser.cjs
php development/tools/browser-fixture.php cleanup
```

Stop that test server afterward. The fixture helper refuses application databases and nonempty test databases. It generates private disposable logins in ignored runtime files; cleanup checks fixture identity and keeps foreign keys enabled. The browser check verifies password-gated workspace changes, real HTTP saves and reloads; its scope is recorded in [browser evidence](docs/evidence/browser.json). Native tests currently pass **74 tests / 373 assertions**, including workspace confirmation, owner API/replay protection and rate limiting. Complete source parity and human acceptance remain outstanding.

## Implementation notes

All writes pass semantic commands through authenticated, CSRF-protected Laravel routes. The server calculates values using decimal strings and BCMath, validates account access and live stock, takes an InnoDB workspace lock, commits related document/stock/cash/audit changes together, and records an actor-scoped idempotency receipt. A failed or uncertain request never saves a browser snapshot as a fallback.

Business dates and recording timestamps are separate columns. Stock lots distinguish trader, PweYon and buyer ownership, and preserve receipt, sale, warehouse, parent-lot and packaging references. Money requests and counts do not post money or stock on submission. Original source callbacks that have not been adapted are blocked at the legacy save boundary and require further parity review; this is one reason full completion is not claimed.

The selected framework's compatibility was checked against [Laravel's database documentation](https://laravel.com/framework/docs/database/config). The original isolated database came from the [official MySQL 8.4 download](https://dev.mysql.com/downloads/mysql/8.4.html?os=3). The active MariaDB installation is the user's existing XAMPP server. Laravel Boost was installed as required by the repository's `AGENTS.md`; the framework version was unchanged.
