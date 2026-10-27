# Local MariaDB switch — 2026-10-26

Later cleanup: completed migration scripts and the redundant downloaded MySQL ZIP were deleted at the user's request. The actual MySQL server/data, SQL backup and private configuration backups described in Recovery remain available. Existing migration/test evidence was retained.

The user explicitly selected option 2: use the existing XAMPP MariaDB server on port **3306**. This replaces the earlier MySQL-only local deployment decision. It does not change the confirmed business interface or calculations.

## Active connection

- Server: **MariaDB 10.11.16**, XAMPP; host `127.0.0.1`, port **3306**.
- Laravel driver: `mariadb`; character set `utf8mb4`, collation `utf8mb4_unicode_ci`.
- Application database: **pweyon**. Dedicated disposable test database: **pweyon_test**.
- Application and test accounts have separate grants restricted to their respective databases. Their random passwords remain in ignored environment files. The application does not use root.
- The original owner account, password hash and Laravel application encryption key were preserved.
- Inspect the database at <http://localhost/phpmyadmin/> and select **pweyon**. XAMPP Apache and its MySQL-labeled MariaDB module must be running. HTTP 200 was observed for phpMyAdmin during this switch.

## Data preservation and schema construction

The destination had no `pweyon` or `pweyon_test` schema before preparation. No existing XAMPP database or user was overwritten, and the MariaDB server port/configuration was not changed.

The application was placed in maintenance mode. MySQL's native `mysqldump` backed up the two original named databases to ignored `archive/private/pweyon-before-mariadb-20261026.sql`. Original environment files were copied to ignored `archive/private/mariadb-switch-20261026/`. These files contain private credentials/password hashes and must not be published.

All **30 real Laravel migrations** ran on the empty destination. No SQL dump was used as the schema bootstrap and no migration history was invented. Existing application records were then copied using parameterized inserts in foreign-key dependency order, inside a destination transaction with foreign keys enabled. The source remained read-only. Self-referencing records retain their IDs.

Every value in **32 non-migration tables** was compared after normalizing only PDO scalar representations. Row counts and SHA-256 comparison results are in `evidence/mariadb-data-copy.json`. The migration name sets were compared separately; target migration history comes from the actual target execution. The preserved user count is one. No business documents, cash movements or stock were invented during the move.

MySQL's `utf8mb4_0900_ai_ci` was replaced by `utf8mb4_unicode_ci` through normal Laravel schema construction. MariaDB uses its JSON representation; the copied JSON text and all persisted logical values were compared. Unicode data, decimals, nulls and account password hashes were retained.

## Compatibility changes and checks

- `.env`, `.env.testing`, `.env.browser`, `.env.example` and `phpunit.xml` now select MariaDB/3306. The application key did not change. Configuration cache was cleared.
- Installer, diagnostic and disposable-test guards accept the explicitly selected MariaDB profile. Exact test database naming and scoped-account protections remain enforced. MariaDB tests require 10.11+ and are identified as MariaDB evidence.
- The existing constraint migration's `down()` chooses MariaDB `DROP CONSTRAINT` or MySQL `DROP CHECK`. Its existing `up()` and constraints were preserved. The full test schema was created, rolled back and recreated successfully in the disposable database only. The application schema was never rolled back.
- The PHPUnit maintenance driver uses its isolated array cache, so application maintenance mode does not contaminate HTTP tests.
- Native MariaDB tests: **49 tests, 169 assertions, PASS**, including foreign keys/checks, decimals, JSON-backed history, rollbacks and independent-connection stock/payment/idempotency races.
- Real Edge browser: owner/clerk authentication, receiving, purchase with partial payment, held sale, later dispatch, collection, reload persistence, CSRF/origin and permissions all passed with zero page errors. Browser fixtures were removed afterward.
- Existing source-interface DOM, historical report/search and print/CSV markup smoke checks passed. Complete business UAT and the previously documented parity gaps remain outstanding.
- `pweyon:install` ran idempotently on the copied workspace. The final comparison confirms original application records remain unchanged.
- Laravel Boost 2.10.3 and its development dependencies were installed because the repository's `AGENTS.md` required Boost setup before application changes. Laravel remains 13.38.0. Boost regenerated the project guidelines. Pint's `--dirty` mode was unavailable because Git is not installed; ordinary Pint formatting was used.

Current evidence: `evidence/mariadb-phpunit.xml`, `mariadb-phpunit.txt`, `mariadb-runtime.txt`, `mariadb-migration-status.txt`, `mariadb-browser.json`, `mariadb-data-copy.json` and `mariadb-cutover.json`. Original MySQL evidence remains under `evidence/mysql-20261025/`; its results were not relabeled as MariaDB.

## Recovery

The original MySQL 8.4.13 data directory remains intact under `archive/private/mysql-3307/mysql-data`. Its port-3307 instance is no longer the application authority and was stopped before the archive move. The binary is under `archive/private/mysql-3307/mysql/mysql-8.4.13-winx64`. Any reviewed recovery must use these relocated basedir/datadir paths explicitly; the archived provisioning scripts retain historical paths and must not be rerun. The data directory must not be initialized again. The active XAMPP MariaDB data directory was not moved.

Before any new MariaDB business writes, recovery can use the preserved source by taking the application down, restarting the original MySQL instance with its original data directory, restoring the saved original environment files, clearing configuration cache, verifying the original connection and bringing the application up. Never overwrite either database. After any new MariaDB business writes, first back up and reconcile those changes before attempting a rollback; switching to the old snapshot alone would omit them.

References checked: [Laravel supported databases](https://laravel.com/framework/docs/database/config), [MariaDB migration guidance](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/migrating-to-mariadb/moving-from-mysql).
