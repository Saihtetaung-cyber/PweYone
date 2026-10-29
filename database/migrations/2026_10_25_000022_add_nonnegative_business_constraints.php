<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE cash_accounts ADD CONSTRAINT cash_balance_nonnegative CHECK (balance >= 0 AND opening_balance >= 0)');
        DB::statement('ALTER TABLE stock_lots ADD CONSTRAINT stock_nonnegative CHECK ((quantity IS NULL OR quantity >= 0) AND (bags IS NULL OR bags >= 0) AND unit_cost >= 0)');
        DB::statement('ALTER TABLE documents ADD CONSTRAINT document_balances_valid CHECK (net >= 0 AND paid >= 0 AND paid <= net AND gross >= 0)');
        DB::statement('ALTER TABLE document_lines ADD CONSTRAINT line_balances_valid CHECK ((quantity IS NULL OR quantity >= 0) AND dispatched >= 0 AND (quantity IS NULL OR dispatched <= quantity) AND paid >= 0 AND paid <= net)');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payment_amount_positive CHECK (amount > 0 AND principal >= 0 AND interest >= 0)');
    }

    public function down(): void
    {
        $drop = str_contains(strtolower(DB::selectOne('SELECT VERSION() AS v')->v), 'mariadb') ? 'DROP CONSTRAINT' : 'DROP CHECK';
        DB::statement("ALTER TABLE payments $drop payment_amount_positive");
        DB::statement("ALTER TABLE document_lines $drop line_balances_valid");
        DB::statement("ALTER TABLE documents $drop document_balances_valid");
        DB::statement("ALTER TABLE stock_lots $drop stock_nonnegative");
        DB::statement("ALTER TABLE cash_accounts $drop cash_balance_nonnegative");
    }
};
