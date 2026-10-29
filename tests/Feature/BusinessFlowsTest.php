<?php

namespace Tests\Feature;

use App\Domain\BusinessService;
use App\Domain\ClosingSnapshot;
use App\Domain\Decimal as D;
use App\Domain\OpeningCashReview;
use App\Domain\OpeningWorkbook;
use App\Domain\Projection;
use App\Domain\Records as R;
use App\Domain\Reports;
use App\Http\WorkspaceAccess;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Illuminate\Validation\ValidationException;
use PharData;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class BusinessFlowsTest extends TestCase
{
    private array $openingWorkbookPaths = [];

    protected User $owner;

    protected User $clerk;

    protected object $trader;

    protected object $buyer;

    protected object $product;

    protected object $warehouse;

    protected object $cash;

    protected object $home;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true) || DB::connection()->getDatabaseName() !== 'pweyon_test') {
            throw new \RuntimeException('Tests require the dedicated pweyon_test MySQL/MariaDB database.');
        }
        $version = DB::selectOne('SELECT VERSION() AS v')->v;
        if (str_contains(strtolower($version), 'mariadb') && version_compare($version, '10.11.0', '<')) {
            throw new \RuntimeException('MariaDB tests require version 10.11 or later.');
        }
        DB::beginTransaction();
        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->clerk = User::factory()->create(['role' => 'clerk']);
        R::insert('operation_locks', ['name' => 'workspace']);
        R::insert('business_days', ['business_date' => '2026-10-25', 'opening_checked' => true]);
        $this->trader = R::insert('partners', ['name' => 'Trader', 'locality' => 'Town', 'kind' => 'supplier']);
        $this->buyer = R::insert('partners', ['name' => 'Buyer', 'locality' => 'Town', 'kind' => 'buyer']);
        $this->product = R::insert('products', ['name' => 'Sesame', 'grades' => ['A'], 'standard_viss' => '25']);
        $this->warehouse = R::insert('warehouses', ['name' => 'Main']);
        $this->cash = R::insert('cash_accounts', ['code' => 'cash', 'name' => 'Cash', 'type' => 'cash', 'staff_can_view' => true, 'opening_balance' => '2000000', 'balance' => '2000000']);
        $this->home = R::insert('cash_accounts', ['code' => 'home', 'name' => 'Home', 'type' => 'home', 'staff_can_view' => false, 'opening_balance' => '500000', 'balance' => '500000']);
        R::insert('funding_categories', ['code' => '3101', 'name' => 'Owner Capital', 'type' => 'equity', 'locked' => true]);
        R::insert('funding_categories', ['code' => '1901', 'name' => 'Internal Transfer', 'type' => 'transfer', 'locked' => true]);
        R::insert('labor_rates', ['name' => 'One handling', 'kind' => 'mael', 'rate' => '1']);
    }

    protected function tearDown(): void
    {
        foreach ($this->openingWorkbookPaths as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        while (DB::transactionLevel() > 0) {
            DB::rollBack();
        }parent::tearDown();
    }

    protected function runCommand(string $action, array $input = [], ?User $actor = null, ?string $key = null): array
    {
        return app(BusinessService::class)->execute($actor ?? $this->owner, $action, $input, $key ?? (string) Str::uuid());
    }

    protected function receive(string $qty = '1500', ?string $bags = null): array
    {
        $row = ['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => $bags === null ? 'weight' : 'raw'];
        if ($qty !== '') {
            $row['quantity'] = $qty;
        }if ($bags !== null) {
            $row['bags'] = $bags;
        }

        return $this->runCommand('receipt.create', ['party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'lines' => [$row], 'vehicle' => 'MDY-123']);
    }

    protected function lot(?string $owner = null): object
    {
        return DB::table('stock_lots')->when($owner, fn ($q) => $q->where('owner', $owner))->orderByDesc('id')->first();
    }

    protected function sale(string $qty = '500', string $delivery = 'hold', array $extra = []): array
    {
        return $this->runCommand('sale.create', $extra + ['party_id' => $this->buyer->id, 'delivery' => $delivery, 'lines' => [['lot_id' => $this->lot()->id, 'quantity' => $qty, 'price' => '1000', 'basis' => 'viss', 'buyer_package_viss' => '25']]]);
    }

    protected function purchase(int $receiptLine, array $extra = []): array
    {
        return $this->runCommand('purchase.create', $extra + ['lines' => [['receipt_line_id' => $receiptLine, 'price' => '800', 'basis' => 'viss']]]);
    }

    protected function equalDecimal(string $expected, mixed $actual): void
    {
        $this->assertSame(0, D::cmp($expected, (string) $actual), "Expected $expected, got $actual");
    }

    private function queryCount(callable $operation): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        try {
            $operation();

            return count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }
    }

    private function openingWorkbook(array $sheets): string
    {
        $base = tempnam(sys_get_temp_dir(), 'pwe-test-opening-');
        $path = $base.'.xlsx';
        unlink($base);
        copy(resource_path('templates/opening-import.xlsx'), $path);
        $this->openingWorkbookPaths[] = $path;
        $archive = new PharData($path);
        $index = 2;
        foreach (OpeningWorkbook::HEADERS as $name => $headers) {
            $doc = new \DOMDocument('1.0', 'UTF-8');
            $root = $doc->appendChild($doc->createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'worksheet'));
            $data = $root->appendChild($doc->createElement('sheetData'));
            foreach (array_merge([$headers], $sheets[$name] ?? []) as $i => $values) {
                $row = $data->appendChild($doc->createElement('row'));
                $row->setAttribute('r', (string) ($i + 5));
                foreach ($values as $j => $value) {
                    $cell = $row->appendChild($doc->createElement('c'));
                    $cell->setAttribute('r', chr(65 + $j).($i + 5));
                    if (is_array($value)) {
                        if (isset($value['formula'])) {
                            $cell->appendChild($doc->createElement('f', $value['formula']));
                        }
                        $cell->appendChild($doc->createElement('v', $value['number'] ?? '1'));
                    } else {
                        $cell->setAttribute('t', 'inlineStr');
                        $text = $cell->appendChild($doc->createElement('is'))->appendChild($doc->createElement('t'));
                        $text->appendChild($doc->createTextNode((string) $value));
                    }
                }
            }
            $archive['xl/worksheets/sheet'.$index++.'.xml'] = $doc->saveXML();
        }
        unset($archive);

        return $path;
    }

    private function previewOpeningWorkbook(string $path, ?User $actor = null): TestResponse
    {
        return $this->actingAs($actor ?? $this->owner)->withSession([WorkspaceAccess::SESSION_KEY => ($actor?->role ?? 'owner') === 'owner' ? 'owner' : 'staff'])
            ->call('POST', '/api/opening/import/preview', [], [], [], ['CONTENT_TYPE' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'HTTP_ACCEPT' => 'application/json', 'HTTP_X_PWE_FILE_NAME' => rawurlencode('opening.xlsx')], file_get_contents($path));
    }

    public function test_opening_excel_template_download_uses_current_visible_masters(): void
    {
        foreach ([$this->owner, $this->clerk] as $actor) {
            $response = $this->actingAs($actor)->withSession([WorkspaceAccess::SESSION_KEY => $actor->role === 'owner' ? 'owner' : 'staff'])->get('/opening/import/template')->assertOk();
            $path = $response->baseResponse->getFile()->getPathname();
            $this->openingWorkbookPaths[] = $path;
            $archive = new PharData($path);
            $lists = $archive['xl/worksheets/sheet1.xml']->getContent();
            $this->assertStringContainsString('Sesame', $lists);
            $this->assertStringContainsString('Trader (Town)', $lists);
            $this->assertStringContainsString('Cash', $lists);
            $this->assertSame($actor->role === 'owner', str_contains($lists, '>Home<'));
            $this->assertSame($actor->role === 'owner', str_contains($lists, 'ကြိုထုတ်ငွေအရင်း'));
            $this->assertSame(['ငွေလက်ကျန်' => [], 'ကုန်လက်ကျန်' => [], 'တစ်ဦးချင်းငွေကျန်' => []], app(OpeningWorkbook::class)->read($path));
        }
    }

    public function test_opening_excel_preview_merge_and_owner_review_post_exactly_once(): void
    {
        $path = $this->openingWorkbook([
            'ငွေလက်ကျန်' => [['Cash', '1,234,567'], ['Home', '500000']],
            'ကုန်လက်ကျန်' => [
                ['ပွဲရုံပိုင်', '', 'Sesame', 'A', 'Main', 'Owned batch', '100.25', '4', 'တစ်စံအိတ်ဈေး', '25000', '25', 'Trader (Town)', 'Imported owned note'],
                ['ကုန်သည်ပိုင်', 'Trader (Town)', 'Sesame', 'A', 'Main', 'Supplier batch', '50.50', '2'],
                ['ဝယ်သူပိုင်', 'Buyer', 'Sesame', 'A', 'Main', 'Buyer batch', '12.50'],
            ],
            'တစ်ဦးချင်းငွေကျန်' => [
                ['ကုန်သည်', 'Trader (Town)', 'ကုန်သည်ကို ပေးရန်', '1000'],
                ['ကုန်သည်', 'Trader (Town)', 'ကြိုသုံးငွေ', '2000'],
                ['ကုန်သည်', 'Trader (Town)', 'ကြိုထုတ်ငွေအရင်း', '3000', '0', '50'],
                ['ဝယ်သူ', 'Buyer', 'ဝယ်သူထံမှ ရရန်', '4000'],
                ['ဝယ်သူ', 'Buyer', 'ဝယ်သူ ကြိုပေးထားငွေ', '5000'],
            ],
        ]);
        $preview = $this->previewOpeningWorkbook($path)->assertOk()->json();
        $this->assertSame(['accounts' => 2, 'stock' => 3, 'balances' => 5], $preview['counts']);
        $this->assertSame(0, DB::table('documents')->count());
        $input = ['token' => $preview['token']];
        $key = (string) Str::uuid();
        $response = $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => $input], ['Idempotency-Key' => $key])->assertOk();
        $this->assertSame($response->json('result'), $this->runCommand('opening.import', $input, key: $key));
        $draft = R::details(DB::table('documents')->where('kind', 'opening')->first());
        $this->assertCount(1, $draft['own']['rows']);
        $this->assertFalse($draft['own']['checked']);
        $this->assertFalse($draft['accounts']['cash']['checked']);
        $this->assertFalse($draft['groups']['supplier']);
        $this->assertSame('0.00000000', $draft['parties'][$this->trader->id]['values']['loanRate']);
        $this->assertSame('draft', $response->json('state.initialOpening69.status'));
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->assertSame(0, DB::table('stock_lots')->count());
        $this->assertSame(0, DB::table('cash_entries')->count());
        $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => $input], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        $this->postJson('/api/commands', ['action' => 'opening.approve', 'input' => []], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        foreach ($draft['accounts'] as &$account) {
            $account['checked'] = true;
        }
        unset($account);
        $draft['own']['checked'] = true;
        $draft['groups'] = ['supplier' => true, 'buyer' => true];
        foreach ($draft['parties'] as &$party) {
            $party['checked'] = true;
        }
        unset($party);
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $approvalKey = (string) Str::uuid();
        $this->runCommand('opening.approve', key: $approvalKey);
        $this->runCommand('opening.approve', key: $approvalKey);
        $this->assertSame(3, DB::table('stock_lots')->count());
        $this->equalDecimal('163.25', DB::table('stock_lots')->sum('quantity'));
        $this->equalDecimal('1000', DB::table('stock_lots')->where('owner', 'owned')->value('unit_cost'));
        $this->equalDecimal('1234567', R::get('cash_accounts', $this->cash->id)->balance);
        $loan = DB::table('documents')->where('kind', 'opening_loan')->first();
        $this->equalDecimal('0', R::details($loan)['rate']);
        $this->equalDecimal('50', R::details($loan)['openingInterest']);
        $owned = collect(app(Projection::class)->forUser($this->owner)['lots'])->firstWhere('owner', 'owned');
        $this->assertSame('Imported owned note', $owned['note']);
        $this->assertSame((string) $this->trader->id, $owned['originPartnerId']);
        $this->assertSame('bag', $owned['openingCostBasis71']);
        $this->previewOpeningWorkbook($path)->assertUnprocessable();
    }

    public function test_opening_excel_invalid_rows_formulas_and_permissions_leave_draft_untouched(): void
    {
        $valid = $this->openingWorkbook(['ငွေလက်ကျန်' => [['Cash', '100']]]);
        $this->previewOpeningWorkbook($valid, $this->clerk)->assertOk();
        foreach ([
            ['ငွေလက်ကျန်' => [['Home', '100']]],
            ['တစ်ဦးချင်းငွေကျန်' => [['ကုန်သည်', 'Trader (Town)', 'ကြိုထုတ်ငွေအရင်း', '100', '0', '0']]],
        ] as $rows) {
            $this->previewOpeningWorkbook($this->openingWorkbook($rows), $this->clerk)->assertUnprocessable();
        }
        $mixed = $this->openingWorkbook(['ငွေလက်ကျန်' => [['Cash', '100'], ['Cash', '200']], 'ကုန်လက်ကျန်' => [['ပွဲရုံပိုင်', '', 'Missing product', 'A', 'Main', '', '1', '', 'တစ်ပိဿာဈေး', '100']]]);
        $response = $this->previewOpeningWorkbook($mixed)->assertUnprocessable();
        $this->assertArrayHasKey('ငွေလက်ကျန် · အတန်း 7', $response->json('errors'));
        $this->previewOpeningWorkbook($this->openingWorkbook(['ငွေလက်ကျန်' => [['Cash', ['formula' => '1+1']]]]))->assertUnprocessable();
        $this->previewOpeningWorkbook($this->openingWorkbook([]))->assertUnprocessable();
        $this->assertSame(0, DB::table('documents')->count());
        $this->assertSame(0, DB::table('stock_lots')->count());
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        $preview = $this->previewOpeningWorkbook($valid)->assertOk()->json();
        $this->actingAs($this->owner)->withSession([WorkspaceAccess::SESSION_KEY => 'staff'])->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => $preview['token']]], ['Idempotency-Key' => (string) Str::uuid()])->assertForbidden();
        $this->actingAs($this->owner)->withSession([WorkspaceAccess::SESSION_KEY => 'owner'])->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => 'tampered']], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        R::update('products', $this->product->id, ['name' => 'Renamed after preview']);
        $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => $preview['token']]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        $this->assertSame(0, DB::table('documents')->count());
    }

    public function test_opening_excel_clerk_merge_preserves_owner_loan_and_hidden_account_and_blocks_repeat_or_expired_token(): void
    {
        $draft = ['schema' => 1, 'status' => 'draft', 'startDate' => '2026-10-25', 'accounts' => ['home' => ['amount' => '9999', 'checked' => true]], 'own' => ['stock' => 'no', 'rows' => [], 'checked' => true], 'parties' => [(string) $this->trader->id => ['answers' => ['stock' => 'no', 'loan' => 'yes'], 'rows' => [], 'values' => ['loan' => '700', 'loanInterest' => '1', 'loanRate' => '3'], 'checked' => true]], 'groups' => ['supplier' => true, 'buyer' => true]];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $path = $this->openingWorkbook(['ငွေလက်ကျန်' => [['Cash', '၀']], 'တစ်ဦးချင်းငွေကျန်' => [['ကုန်သည်', 'Trader (Town)', 'ကုန်သည်ကို ပေးရန်', ['number' => '1E+3']]]]);
        $preview = $this->previewOpeningWorkbook($path, $this->clerk)->assertOk()->json();
        $response = $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => $preview['token']]], ['Idempotency-Key' => (string) Str::uuid()])->assertOk();
        $this->assertArrayNotHasKey('home', $response->json('state.initialOpening69.accounts'));
        $saved = R::details(DB::table('documents')->where('kind', 'opening')->first());
        $this->assertSame('9999', $saved['accounts']['home']['amount']);
        $this->assertSame('0', $saved['accounts']['cash']['amount']);
        $this->assertSame('700', $saved['parties'][$this->trader->id]['values']['loan']);
        $this->assertSame('1000', $saved['parties'][$this->trader->id]['values']['payable']);
        $this->assertFalse($saved['parties'][$this->trader->id]['checked']);
        $again = $this->previewOpeningWorkbook($path, $this->clerk)->assertOk()->json();
        $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => $again['token']]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        $newPath = $this->openingWorkbook(['ငွေလက်ကျန်' => [['Cash', '1']]]);
        $next = $this->previewOpeningWorkbook($newPath, $this->clerk)->assertOk()->json();
        $this->travel(31)->minutes();
        try {
            $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => $next['token']]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        } finally {
            $this->travelBack();
        }
        $this->assertSame($saved, R::details(DB::table('documents')->where('kind', 'opening')->first()));
    }

    public function test_opening_excel_requires_auth_and_rejects_oversized_non_xlsx_and_xml_entities(): void
    {
        $this->get('/opening/import/template')->assertRedirect('/login');
        $this->postJson('/api/opening/import/preview', [])->assertUnauthorized();
        $path = $this->openingWorkbook(['ငွေလက်ကျန်' => [['Cash', '100']]]);
        $this->actingAs($this->owner)->withSession([WorkspaceAccess::SESSION_KEY => 'owner'])
            ->call('POST', '/api/opening/import/preview', [], [], [], ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_PWE_FILE_NAME' => 'opening.txt'], file_get_contents($path))->assertUnprocessable();
        $this->call('POST', '/api/opening/import/preview', [], [], [], ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_PWE_FILE_NAME' => 'opening.xlsx'], str_repeat('x', 2097153))->assertUnprocessable();
        $archive = new PharData($path);
        $source = $archive['xl/workbook.xml']->getContent();
        $source = str_replace('?>', '?><!DOCTYPE workbook [<!ENTITY test SYSTEM "file:///pweyon-nonexistent-test-file">]>', $source);
        $archive['xl/workbook.xml'] = $source;
        unset($archive);
        $this->previewOpeningWorkbook($path)->assertUnprocessable();
        $this->assertSame(0, DB::table('documents')->count());
    }

    public function test_opening_excel_duplicate_stock_batches_are_rejected_within_file_and_against_existing_draft(): void
    {
        $row = ['ပွဲရုံပိုင်', '', 'Sesame', 'A', 'Main', 'Same batch', '100', '', 'တစ်ပိဿာဈေး', '1000'];
        $this->previewOpeningWorkbook($this->openingWorkbook(['ကုန်လက်ကျန်' => [$row, $row]]))->assertUnprocessable();
        $this->assertSame(0, DB::table('documents')->count());
        $first = $this->previewOpeningWorkbook($this->openingWorkbook(['ကုန်လက်ကျန်' => [$row]]))->assertOk()->json();
        $this->postJson('/api/commands', ['action' => 'opening.import', 'input' => ['token' => $first['token']]], ['Idempotency-Key' => (string) Str::uuid()])->assertOk();
        $changedFile = $this->openingWorkbook(['ကုန်လက်ကျန်' => [$row], 'ငွေလက်ကျန်' => [['Cash', '10']]]);
        $this->previewOpeningWorkbook($changedFile)->assertUnprocessable();
        $draft = R::details(DB::table('documents')->where('kind', 'opening')->first());
        $this->assertCount(1, $draft['own']['rows']);
        $this->assertCount(1, $draft['imports']);
        $this->assertSame(0, DB::table('stock_lots')->count());
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_receive_purchase_partial_payment(): void
    {
        $r = $this->receive();
        $p = $this->purchase($r['line_ids'][0], ['payments' => [['account_id' => $this->cash->id, 'amount' => '100000']]]);
        $doc = R::get('documents', $p['document_id']);
        $this->equalDecimal('1200000', $doc->net);
        $this->equalDecimal('100000', $doc->paid);
        $this->equalDecimal('1500', DB::table('stock_lots')->sum('quantity'));
        $this->equalDecimal('1900000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_multi_product_receiving_advances_voucher_numbers_after_refresh_and_replays_once(): void
    {
        $corn = R::insert('products', ['name' => 'Corn', 'grades' => ['A'], 'standard_viss' => '25']);
        $wheat = R::insert('products', ['name' => 'Wheat', 'grades' => ['A'], 'standard_viss' => '25']);
        $input = ['number' => 'RCPT-1000001', 'party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'lines' => [
            ['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'raw', 'bags' => '4'],
            ['product_id' => $corn->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '1500'],
            ['product_id' => $wheat->id, 'grade' => 'A', 'bag_type' => 'finished', 'bags' => '2', 'package_viss' => '25'],
        ]];
        $this->runCommand('receipt.create', $input);
        $state = app(Projection::class)->forUser($this->clerk);
        $this->assertSame(1000001, $state['counter']);
        $input['number'] = 'RCPT-'.($state['counter'] + 1);
        $key = (string) Str::uuid();
        $result = $this->runCommand('receipt.create', $input, $this->clerk, $key);
        $this->assertSame($result, $this->runCommand('receipt.create', $input, $this->clerk, $key));
        $this->assertSame(2, DB::table('documents')->where('kind', 'receipt')->count());
        $this->assertSame(6, DB::table('document_lines')->count());
        $this->assertSame(6, DB::table('stock_lots')->count());
        $this->assertSame(6, DB::table('stock_events')->where('kind', 'receive')->count());
        $this->assertSame(2, DB::table('stock_lots')->whereNull('quantity')->count());
        $this->assertSame(1000002, app(Projection::class)->forUser($this->clerk)['counter']);
    }

    public function test_receipt_numbers_are_server_generated_and_cannot_be_renamed(): void
    {
        $input = ['number' => 'RCPT-1000001', 'party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '1500']]];
        $first = $this->runCommand('receipt.create', $input);
        $second = $this->runCommand('receipt.create', $input);
        $firstNumber = R::get('documents', $first['document_id'])->number;
        $secondNumber = R::get('documents', $second['document_id'])->number;
        $this->assertSame('အလ-1000001', $firstNumber);
        $this->assertSame('အလ-1000002', $secondNumber);
        $this->assertSame(2, DB::table('document_lines')->count());
        $this->assertSame(2, DB::table('stock_lots')->count());
        $this->actingAs($this->clerk)->postJson('/api/commands', ['action' => 'receipt.edit', 'input' => ['document_id' => $second['document_id'], 'number' => 'CHANGED-123']], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertUnprocessable()->assertJsonValidationErrors('number');
        $this->assertSame($secondNumber, R::get('documents', $second['document_id'])->number);
        $this->assertSame($firstNumber, R::get('documents', $first['document_id'])->number);
    }

    public function test_1500_held_sale_500_purchase_remaining_1000(): void
    {
        $r = $this->receive();
        $s = $this->sale();
        $p = $this->purchase($r['line_ids'][0], ['payments' => [['account_id' => $this->cash->id, 'amount' => '100000']]]);
        $this->equalDecimal('1500', DB::table('stock_lots')->sum('quantity'));
        $this->equalDecimal('1000', $this->lot('owned')->quantity);
        $this->equalDecimal('500', $this->lot('customer')->quantity);
        $this->equalDecimal('800000', R::get('documents', $p['document_id'])->net);
        $this->equalDecimal('500000', DB::table('documents')->where('kind', 'settlement')->value('net'));
        $state = app(Projection::class)->forUser($this->owner);
        $this->equalDecimal('1500', $state['receipts'][0]['remainingPurchase2']['original']['qty']);
    }

    public function test_trader_settlement_is_separate_from_buyer_collection(): void
    {
        $this->receive();
        $this->sale();
        $settlement = DB::table('documents')->where('kind', 'settlement')->first();
        $this->runCommand('settlement.confirm', ['document_id' => $settlement->id]);
        $this->runCommand('payment.create', ['document_id' => $settlement->id, 'payments' => [['account_id' => $this->cash->id, 'amount' => '120000']]]);
        $this->equalDecimal('0', DB::table('documents')->where('kind', 'sale')->value('paid'));
        $this->equalDecimal('1500', DB::table('stock_lots')->sum('quantity'));
    }

    public function test_held_sale_multiple_partial_dispatches(): void
    {
        $this->receive();
        $this->sale();
        $held = $this->lot('customer');
        $this->runCommand('dispatch.create', ['lot_id' => $held->id, 'quantity' => '100']);
        $this->runCommand('dispatch.create', ['lot_id' => $held->id, 'quantity' => '150']);
        $this->equalDecimal('1250', DB::table('stock_lots')->sum('quantity'));
        $this->equalDecimal('250', R::get('stock_lots', $held->id)->quantity);
        $this->assertSame(1, DB::table('documents')->where('kind', 'sale')->count());
    }

    public function test_immediate_dispatch_reduces_physical_stock_once(): void
    {
        $this->receive();
        $this->sale('500', 'direct');
        $this->equalDecimal('1000', DB::table('stock_lots')->sum('quantity'));
        $this->assertSame(0, DB::table('stock_lots')->where('owner', 'customer')->count());
    }

    public function test_collection_request_reconciles_partial_direct_collection(): void
    {
        $this->receive();
        $sale = $this->sale();
        $request = $this->runCommand('request.create', ['kind' => 'collection', 'document_id' => $sale['document_id'], 'amount' => '200000', 'collector' => 'Clerk']);
        $this->runCommand('payment.create', ['document_id' => $sale['document_id'], 'payments' => [['account_id' => $this->cash->id, 'amount' => '50000']]]);
        $this->equalDecimal('50000', R::get('documents', $request['document_id'])->paid);
        $this->runCommand('request.receive', ['document_id' => $request['document_id'], 'amount' => '100000', 'account_id' => $this->cash->id, 'confirmed' => true]);
        $this->equalDecimal('150000', R::get('documents', $sale['document_id'])->paid);
        $this->equalDecimal('2150000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_packaging_and_warehouse_transfer_preserve_total_weight(): void
    {
        $received = $this->receive('300', '10');
        $type = R::insert('package_types', ['product_id' => $this->product->id, 'name' => '20 viss', 'size' => '20']);
        $warehouse = R::insert('warehouses', ['name' => 'Second']);
        $packed = $this->runCommand('packaging.create', ['lot_id' => $this->lot()->id, 'package_type_id' => $type->id, 'bags' => '10']);
        $this->runCommand('warehouse.transfer', ['lot_id' => $packed['lot_id'], 'warehouse_id' => $warehouse->id, 'quantity' => '100', 'bags' => '5']);
        $this->equalDecimal('300', DB::table('stock_lots')->sum('quantity'));
        $this->equalDecimal('100', DB::table('stock_lots')->where('warehouse_id', $warehouse->id)->sum('quantity'));
        $event = DB::table('stock_events')->where('kind', 'pack')->first();
        $snapshot = R::details($event);
        $history = app(Projection::class)->forUser($this->clerk)['packagingTransactions'][0]['history2'];
        $this->assertSame('Sesame', $history['product']);
        $this->assertSame('Trader', $history['ownerName']);
        $this->assertSame('supplier', $history['owner']);
        $this->assertSame('Main', $history['warehouseName']);
        $this->assertSame('raw', $history['sourceBagType']);
        $this->assertSame('owner', $history['role']);
        foreach (['qtyBefore' => '300', 'packedQty' => '200', 'qtyAfter' => '100', 'bagCount' => '10', 'packageViss' => '20', 'originalRawBags' => '10'] as $key => $value) {
            $this->equalDecimal($value, $history[$key]);
        }
        $this->assertSame(R::get('documents', $received['document_id'])->number, $history['sourceReceiptNo']);

        $legacy = array_intersect_key($snapshot, array_flip(['packName', 'qtyBefore', 'qtyAfter', 'sourceRawBags', 'owner', 'destinationOwner', 'warehouse', 'party', 'receiptLine']));
        R::update('stock_events', $event->id, ['details' => $legacy]);
        $receiptLine = DB::table('document_lines')->where('document_id', $received['document_id'])->first();
        $this->purchase($receiptLine->id);
        $legacyState = app(Projection::class)->forUser($this->owner)['packagingTransactions'][0];
        $this->assertSame('supplier', $legacyState['owner']);
        $this->assertSame('Trader', $legacyState['history2']['ownerName']);
        $this->assertSame('Sesame', $legacyState['history2']['product']);
        $this->equalDecimal('200', $legacyState['history2']['packedQty']);
        $this->equalDecimal('10', $legacyState['history2']['bagCount']);
        $this->equalDecimal('20', $legacyState['history2']['packageViss']);
        $this->assertSame($history['sourceReceiptNo'], $legacyState['history2']['sourceReceiptNo']);

        R::update('stock_events', $event->id, ['details' => $snapshot]);
        R::update('products', $this->product->id, ['name' => 'Renamed product']);
        R::update('partners', $this->trader->id, ['name' => 'Renamed trader']);
        R::update('warehouses', $this->warehouse->id, ['name' => 'Renamed warehouse']);
        $savedEntry = app(Projection::class)->forUser($this->owner)['packagingTransactions'][0];
        $saved = $savedEntry['history2'];
        $this->assertSame('Sesame', $saved['product']);
        $this->assertSame('Trader', $saved['ownerName']);
        $this->assertSame('Main', $saved['warehouseName']);
        $this->runCommand('packaging.create', ['lot_id' => $event->lot_id, 'package_type_id' => $type->id, 'bags' => '1']);
        $owned = app(Projection::class)->forUser($this->clerk)['packagingTransactions'][1]['history2'];
        $this->assertSame('owned', $owned['owner']);
        $this->assertSame('ပွဲရုံပိုင်', $owned['ownerName']);
        $this->equalDecimal('20', $owned['packedQty']);
    }

    public function test_unknown_weight_transfer_does_not_invent_weight_or_bags(): void
    {
        $this->receive('', '10');
        $warehouse = R::insert('warehouses', ['name' => 'Second']);
        $out = $this->runCommand('warehouse.transfer', ['lot_id' => $this->lot()->id, 'warehouse_id' => $warehouse->id, 'bags' => '4']);
        $this->assertNull(R::get('stock_lots', $out['lot_id'])->quantity);
        $this->equalDecimal('10', DB::table('stock_lots')->sum('bags'));
        $this->runCommand('receipt.weigh', ['lot_id' => $out['lot_id'], 'quantity' => '120']);
        $this->equalDecimal('120', R::get('stock_lots', $out['lot_id'])->quantity);
    }

    public function test_separate_weighings_preserve_original_weight_after_partial_dispatch(): void
    {
        $receipt = $this->receive('', '10');
        $source = $this->lot();
        $warehouse = R::insert('warehouses', ['name' => 'Second']);
        $out = $this->runCommand('warehouse.transfer', ['lot_id' => $source->id, 'warehouse_id' => $warehouse->id, 'bags' => '4']);
        $this->runCommand('receipt.weigh', ['lot_id' => $out['lot_id'], 'quantity' => '120']);
        $this->sale('100', 'direct');
        $this->runCommand('receipt.weigh', ['lot_id' => $source->id, 'quantity' => '180']);
        $this->equalDecimal('300', R::get('document_lines', $receipt['line_ids'][0])->quantity);
        $this->equalDecimal('200', DB::table('stock_lots')->sum('quantity'));
        $purchase = $this->purchase($receipt['line_ids'][0]);
        $this->equalDecimal('160000', R::get('documents', $purchase['document_id'])->gross);
        $ledger = app(Reports::class)->stock($this->owner, '2026-10-25', '2026-10-25');
        $this->assertFalse($ledger['groups'][0]['unknown']);
        $this->equalDecimal('200', $ledger['groups'][0]['closing']);
    }

    public function test_stock_ledger_preserves_unknown_at_old_cutoff_and_resolves_after_actual_weighing(): void
    {
        $this->receive('', '10');
        $this->runCommand('day.close', ['actual' => '2000000', 'transfer' => '0', 'confirmed' => true]);
        $this->runCommand('day.next');
        $this->runCommand('day.open', ['actual' => '2000000']);
        $this->runCommand('receipt.weigh', ['lot_id' => $this->lot()->id, 'quantity' => '300']);
        $old = app(Reports::class)->stock($this->owner, '2026-10-25', '2026-10-25');
        $today = app(Reports::class)->stock($this->owner, '2026-10-26', '2026-10-26');
        $this->assertTrue($old['groups'][0]['unknown']);
        $this->assertTrue($today['groups'][0]['openingUnknown']);
        $this->assertFalse($today['groups'][0]['unknown']);
        $this->equalDecimal('300', $today['groups'][0]['closing']);
    }

    public function test_approved_unknown_weight_count_is_a_measurement_not_a_second_receipt_delta(): void
    {
        $receipt = $this->receive('', '10');
        $check = $this->runCommand('stock.check.submit', ['lot_id' => $this->lot()->id, 'quantity' => '300', 'reason' => 'Weighed']);
        $this->runCommand('stock.check.approve', ['id' => $check['id']]);
        $this->equalDecimal('300', R::get('document_lines', $receipt['line_ids'][0])->quantity);
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertTrue($state['adjustments'][0]['receiptQtyIncluded2']);
        $this->assertSame('supplier', $state['adjustments'][0]['history2']['owner']);
        $this->equalDecimal('300', $state['adjustments'][0]['history2']['qtyDelta']);
    }

    public function test_stock_check_submission_rejection_and_approval(): void
    {
        $this->receive('300');
        $lot = $this->lot();
        $check = $this->runCommand('stock.check.submit', ['lot_id' => $lot->id, 'quantity' => '290', 'reason' => 'Count']);
        $this->equalDecimal('300', R::get('stock_lots', $lot->id)->quantity);
        $this->runCommand('stock.check.reject', ['id' => $check['id'], 'note' => 'Recount']);
        $this->equalDecimal('300', R::get('stock_lots', $lot->id)->quantity);
        $check = $this->runCommand('stock.check.submit', ['lot_id' => $lot->id, 'quantity' => '295', 'reason' => 'Recount']);
        $this->runCommand('stock.check.approve', ['id' => $check['id']]);
        $this->equalDecimal('295', R::get('stock_lots', $lot->id)->quantity);
    }

    public function test_stale_stock_check_cannot_overwrite_new_stock(): void
    {
        $this->receive('300');
        $lot = $this->lot();
        $check = $this->runCommand('stock.check.submit', ['lot_id' => $lot->id, 'quantity' => '290', 'reason' => 'Count']);
        $this->sale('50', 'direct');
        $this->expectException(ValidationException::class);
        $this->runCommand('stock.check.approve', ['id' => $check['id']]);
    }

    public function test_advance_and_loan_offsets_do_not_repeat_cash_movements(): void
    {
        $r = $this->receive();
        $advance = $this->runCommand('advance.create', ['party_id' => $this->trader->id, 'amount' => '10000', 'account_id' => $this->cash->id]);
        $loan = $this->runCommand('loan.create', ['party_id' => $this->trader->id, 'amount' => '20000', 'rate' => '3', 'account_id' => $this->cash->id]);
        $before = R::get('cash_accounts', $this->cash->id)->balance;
        $p = $this->purchase($r['line_ids'][0], ['recoveries' => [['document_id' => $advance['document_id'], 'amount' => '10000']], 'loan_offsets' => [['document_id' => $loan['document_id'], 'principal' => '5000', 'interest' => '0']]]);
        $this->equalDecimal($before, R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('1185000', R::get('documents', $p['document_id'])->net);
    }

    public function test_partial_carriage_recovery_preserves_outlay_and_cash_and_rejects_excess(): void
    {
        $receipt = $this->runCommand('receipt.create', ['party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'carriage_amount' => '12000.34', 'carriage_account_id' => $this->cash->id, 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '1000']]]);
        $outlay = DB::table('documents')->where('kind', 'outlay')->where('source_document_id', $receipt['document_id'])->first();
        $before = R::get('cash_accounts', $this->cash->id)->balance;
        $input = ['lines' => [['receipt_line_id' => $receipt['line_ids'][0], 'price' => '800', 'basis' => 'viss']], 'recoveries' => [['document_id' => $outlay->id, 'amount' => '5000.12']]];
        $key = (string) Str::uuid();
        $purchase = $this->runCommand('purchase.create', $input, $this->owner, $key);
        $this->assertSame($purchase, $this->runCommand('purchase.create', $input, $this->owner, $key));
        $this->equalDecimal('794999.88', R::get('documents', $purchase['document_id'])->net);
        $this->equalDecimal($before, R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('12000.34', R::get('documents', $outlay->id)->net);
        $this->assertSame(1, DB::table('recoveries')->where('source_document_id', $outlay->id)->count());
        $state = app(Projection::class)->forUser($this->owner);
        $expense = collect($state['expenses'])->firstWhere('id', (string) $outlay->id);
        $this->assertSame((string) $receipt['document_id'], $expense['sourceDocumentId']);
        $this->assertFalse($expense['recovered']);
        $this->equalDecimal('5000.12', $expense['settlementRecoveries74'][0]['amount']);
        $other = $this->receive('1000');
        try {
            $this->purchase($other['line_ids'][0], ['recoveries' => [['document_id' => $outlay->id, 'amount' => '7000.23']]]);
            $this->fail('Recovery cannot exceed the remaining carriage balance.');
        } catch (ValidationException $exception) {
            $this->assertSame(1, DB::table('documents')->where('kind', 'purchase')->count());
            $this->assertSame(1, DB::table('recoveries')->where('source_document_id', $outlay->id)->count());
        }
    }

    public function test_home_request_issuance_and_partial_receipts_are_separate(): void
    {
        $r = $this->runCommand('request.create', ['kind' => 'home', 'amount' => '100000', 'collector' => 'Clerk', 'reason' => 'Working cash']);
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->runCommand('request.receive', ['document_id' => $r['document_id'], 'amount' => '40000', 'account_id' => $this->cash->id, 'confirmed' => true], $this->clerk);
        $this->equalDecimal('2040000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('460000', R::get('cash_accounts', $this->home->id)->balance);
    }

    public function test_opening_discrepancy_allows_work_without_balance_adjustment(): void
    {
        DB::table('business_days')->update(['opening_checked' => false]);
        $result = $this->runCommand('day.open', ['actual' => '1999900', 'note' => 'Pending investigation']);
        $this->equalDecimal('-100', $result['difference']);
        $this->receive('300');
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_morning_opening_shows_current_pweyon_cash_then_preserves_checked_snapshot(): void
    {
        DB::table('business_days')->update(['opening_checked' => false, 'opening_expected' => '0']);
        R::update('cash_accounts', $this->cash->id, ['balance' => '321000']);
        R::insert('cash_accounts', ['code' => 'other-cash', 'name' => 'Other cash', 'type' => 'cash', 'staff_can_view' => true, 'balance' => '999999', 'opening_balance' => '999999']);
        foreach ([$this->owner, $this->clerk] as $actor) {
            $state = app(Projection::class)->forUser($actor);
            $this->equalDecimal('321000', $state['opening']['expected']);
        }
        $this->runCommand('day.open', ['actual' => '321000'], $this->clerk);
        R::update('cash_accounts', $this->cash->id, ['balance' => '300000']);
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertTrue($state['opening']['checked']);
        $this->equalDecimal('321000', $state['opening']['expected']);
        $this->equalDecimal('321000', $state['opening']['actual']);
        $this->equalDecimal('0', $state['opening']['difference']);
        $this->assertSame(0, DB::table('cash_entries')->count());
    }

    private function cashCheck(?string $date = null): array
    {
        $day = DB::table('business_days')->when($date, fn ($q) => $q->where('business_date', $date))->orderByDesc('business_date')->first();

        return app(OpeningCashReview::class)->describe($day);
    }

    private function openingDecision(string $action, array $extra = [], ?string $date = null): array
    {
        $check = $this->cashCheck($date);

        return $this->runCommand($action, $extra + ['id' => $check['id'], 'fingerprint' => $check['fingerprint'], 'confirmed' => true]);
    }

    private function assertOpeningRejected(string $action, array $extra = []): void
    {
        $before = DB::table('cash_entries')->count();
        try {
            $this->openingDecision($action, $extra);
            $this->fail('Invalid opening cash decision was accepted.');
        } catch (ValidationException $e) {
            $this->assertNotEmpty($e->errors());
        }
        $this->assertSame($before, DB::table('cash_entries')->count());
    }

    private function openingDiscrepancy(string $actual = '1980000'): void
    {
        DB::table('business_days')->update(['opening_checked' => false]);
        $this->runCommand('day.open', ['actual' => $actual, 'note' => 'Check original cash'], $this->clerk);
    }

    public function test_opening_cash_review_and_multiple_links_preserve_money_and_original_count(): void
    {
        $this->openingDiscrepancy();
        $check = $this->cashCheck();
        $this->assertSame('pending', $check['status']);
        $this->assertSame('clerk', $check['submittedRole']);
        $this->assertNotNull($check['submittedAt']);
        $this->receive('300');
        $this->assertOpeningRejected('day.resolve', ['method' => 'recount', 'actual' => '2000000', 'note' => 'Too early']);
        $this->assertOpeningRejected('day.review', ['confirmed' => false]);
        $this->openingDecision('day.review', ['note' => 'Investigating']);
        $this->assertSame('reviewed', $this->cashCheck()['status']);
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        foreach (['12000', '8000'] as $amount) {
            $this->runCommand('expense.create', ['amount' => $amount, 'reason' => 'Previously omitted expense', 'account_id' => $this->cash->id], $this->clerk);
        }
        $ids = DB::table('cash_entries')->pluck('id')->all();
        $candidates = app(OpeningCashReview::class)->candidates(DB::table('business_days')->first());
        $this->assertCount(2, $candidates);
        $this->assertSame(['Previously omitted expense', 'Previously omitted expense'], array_column($candidates, 'purpose'));
        $this->assertOpeningRejected('day.resolve', ['method' => 'link', 'entry_ids' => [$ids[0]], 'note' => 'Partial']);
        $this->assertOpeningRejected('day.resolve', ['method' => 'link', 'entry_ids' => [$ids[0], $ids[0]], 'note' => 'Duplicate']);
        $this->assertOpeningRejected('day.resolve', ['method' => 'link', 'entry_ids' => $ids, 'note' => '']);
        $check = $this->cashCheck();
        $input = ['id' => $check['id'], 'fingerprint' => $check['fingerprint'], 'confirmed' => true, 'method' => 'link', 'entry_ids' => $ids, 'note' => 'Found omitted expenses'];
        $key = (string) Str::uuid();
        $first = $this->runCommand('day.resolve', $input, key: $key);
        $this->assertSame($first, $this->runCommand('day.resolve', $input, key: $key));
        $check = $this->cashCheck();
        $this->assertSame('linked', $check['status']);
        $this->assertCount(2, $check['resolution']['entries']);
        $this->assertSame(['Previously omitted expense', 'Previously omitted expense'], array_column($check['resolution']['entries'], 'purpose'));
        $this->equalDecimal('1980000', $check['actual']);
        $this->equalDecimal('-20000', $check['difference']);
        $this->equalDecimal('1980000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->assertSame(2, DB::table('cash_entries')->count());
    }

    public function test_opening_cash_recount_requires_expected_amount_and_keeps_history_after_day_rollover(): void
    {
        $this->openingDiscrepancy();
        $this->runCommand('day.close', ['actual' => '1980000', 'note' => 'Unresolved opening', 'confirmed' => true]);
        $this->runCommand('day.next');
        $this->assertFalse($this->cashCheck()['checked']);
        $this->openingDecision('day.review', [], '2026-10-25');
        $old = $this->cashCheck('2026-10-25');
        foreach (['1990000', '1980000'] as $actual) {
            try {
                $this->runCommand('day.resolve', ['id' => $old['id'], 'fingerprint' => $old['fingerprint'], 'method' => 'recount', 'actual' => $actual, 'confirmed' => true, 'note' => 'Still different']);
                $this->fail('Unmatched recount accepted.');
            } catch (ValidationException $e) {
                $this->assertNotEmpty($e->errors());
            }
        }
        $this->openingDecision('day.resolve', ['method' => 'recount', 'actual' => '2000000', 'note' => 'Original count omitted a bundle'], '2026-10-25');
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertSame('recounted', $state['openingCashChecks'][0]['status']);
        $this->equalDecimal('1980000', $state['openingCashChecks'][0]['actual']);
        $this->equalDecimal('2000000', $state['openingCashChecks'][0]['resolution']['actual']);
        $this->assertSame([], app(Projection::class)->forUser($this->clerk)['openingCashChecks']);
        $this->assertSame(0, DB::table('cash_entries')->count());
    }

    public function test_opening_cash_candidate_rules_and_legacy_same_day_opt_in(): void
    {
        $this->runCommand('expense.create', ['amount' => '100', 'reason' => 'Already recorded', 'account_id' => $this->cash->id]);
        $preexisting = DB::table('cash_entries')->value('id');
        $this->openingDiscrepancy('1999800');
        $this->openingDecision('day.review');
        $this->runCommand('expense.create', ['amount' => '100', 'reason' => 'Correction', 'account_id' => $this->cash->id]);
        $valid = DB::table('cash_entries')->max('id');
        $bank = R::insert('cash_accounts', ['code' => 'bank-test', 'name' => 'Bank', 'type' => 'bank']);
        $this->runCommand('cash.fund', ['amount' => '100', 'source_id' => $this->home->id, 'destination_id' => $bank->id, 'description' => 'Home to bank', 'confirmed' => true]);
        $this->runCommand('expense.create', ['amount' => '101', 'reason' => 'Too large', 'account_id' => $this->cash->id]);
        $this->runCommand('cash.fund', ['amount' => '100', 'destination_id' => $this->cash->id, 'description' => 'Wrong direction', 'confirmed' => true]);
        $service = app(OpeningCashReview::class);
        $day = DB::table('business_days')->first();
        $this->assertSame([(string) $valid], array_column($service->candidates($day, true), 'id'));
        $this->assertOpeningRejected('day.resolve', ['method' => 'link', 'entry_ids' => [$preexisting], 'include_legacy_same_day' => true, 'note' => 'Cannot bypass new snapshot']);
        $meta = $service->metadata($day);
        unset($meta['cashEntryWatermark'], $meta['submittedAt'], $meta['submittedBy'], $meta['submittedRole']);
        R::update('business_days', $day->id, ['opening_review' => $meta]);
        $day = R::get('business_days', $day->id);
        $this->assertSame([], $service->candidates($day));
        $this->assertContains((string) $preexisting, array_column($service->candidates($day, true), 'id'));
        $this->assertNull($service->describe($day)['submittedAt']);
        $this->assertOpeningRejected('day.resolve', ['method' => 'link', 'entry_ids' => [$valid], 'note' => 'Missing opt in']);
        $this->openingDecision('day.resolve', ['method' => 'link', 'entry_ids' => [$valid], 'include_legacy_same_day' => true, 'note' => 'Evidence checked']);
        $this->assertSame('linked', $this->cashCheck()['status']);
    }

    public function test_opening_cash_reversed_or_changed_links_reopen_and_can_be_resolved_again(): void
    {
        $this->openingDiscrepancy('2000100');
        $this->openingDecision('day.review');
        $fund = $this->runCommand('cash.fund', ['amount' => '100', 'destination_id' => $this->cash->id, 'description' => 'Omitted cash in', 'confirmed' => true]);
        $entry = DB::table('cash_entries')->where('document_id', $fund['document_id'])->first();
        $this->openingDecision('day.resolve', ['method' => 'link', 'entry_ids' => [$entry->id], 'note' => 'Verified']);
        $this->assertSame('linked', $this->cashCheck()['status']);
        R::update('cash_entries', $entry->id, ['amount' => '99']);
        $this->assertSame('invalid', $this->cashCheck()['status']);
        R::update('cash_entries', $entry->id, ['amount' => '100', 'business_date' => '2026-10-24']);
        $this->assertSame('invalid', $this->cashCheck()['status']);
        R::update('cash_entries', $entry->id, ['business_date' => '2026-10-25']);
        $this->runCommand('cash.reverse', ['document_id' => $fund['document_id'], 'reason' => 'Wrong cash receipt']);
        $this->assertSame('invalid', $this->cashCheck()['status']);
        $this->assertSame([], app(OpeningCashReview::class)->candidates(DB::table('business_days')->first()));
        $this->openingDecision('day.resolve', ['method' => 'recount', 'actual' => '2000000', 'note' => 'Recounted original cash']);
        $this->assertSame('recounted', $this->cashCheck()['status']);
        $this->assertCount(1, $this->cashCheck()['history']);
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_opening_cash_owner_permissions_stale_forms_and_duplicate_link_guard(): void
    {
        $this->openingDiscrepancy();
        $check = $this->cashCheck();
        foreach (['day.review', 'day.resolve'] as $action) {
            $this->actingAs($this->clerk)->postJson('/api/commands', ['action' => $action, 'input' => ['id' => $check['id'], 'fingerprint' => $check['fingerprint'], 'confirmed' => true]], ['Idempotency-Key' => (string) Str::uuid()])->assertForbidden();
        }
        $this->actingAs($this->owner)->withSession([WorkspaceAccess::SESSION_KEY => 'staff'])->postJson('/api/commands', ['action' => 'day.review', 'input' => ['id' => $check['id'], 'fingerprint' => $check['fingerprint'], 'confirmed' => true]], ['Idempotency-Key' => (string) Str::uuid()])->assertForbidden();
        $this->openingDecision('day.review');
        $this->assertOpeningRejected('day.resolve', ['fingerprint' => $check['fingerprint'], 'method' => 'recount', 'actual' => '2000000', 'note' => 'Stale']);
        $this->runCommand('expense.create', ['amount' => '20000', 'reason' => 'Correction', 'account_id' => $this->cash->id]);
        $id = DB::table('cash_entries')->value('id');
        $this->openingDecision('day.resolve', ['method' => 'link', 'entry_ids' => [$id], 'note' => 'Linked once']);
        $meta = ['reviewedAt' => now()->toIso8601String()];
        $other = R::insert('business_days', ['business_date' => '2026-10-24', 'opening_checked' => true, 'opening_expected' => '2000000', 'opening_actual' => '1980000', 'opening_review' => $meta]);
        $this->assertSame([], app(OpeningCashReview::class)->candidates($other, true));
        $this->assertOpeningRejected('day.resolve', ['method' => 'recount', 'actual' => '2000000', 'note' => 'Already resolved']);
    }

    public function test_clerk_can_advance_only_once_per_calendar_day_and_owner_can_continue(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-29 10:00:00', 'Asia/Yangon'));
        try {
            $close = ['actual' => '2000000', 'confirmed' => true];
            $this->runCommand('day.close', $close, $this->clerk);
            $key = (string) Str::uuid();
            $next = $this->runCommand('day.next', [], $this->clerk, $key);
            $this->assertSame($next, $this->runCommand('day.next', [], $this->clerk, $key));
            $this->assertSame(2, DB::table('business_days')->count());
            $this->runCommand('day.open', ['actual' => '2000000'], $this->clerk);
            $this->runCommand('day.close', $close, $this->clerk);
            $otherClerk = User::factory()->create(['role' => 'clerk']);
            foreach ([$this->clerk, $otherClerk] as $actor) {
                $this->actingAs($actor)->postJson('/api/commands', ['action' => 'day.next', 'input' => []], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
                $this->assertFalse(app(Projection::class)->forUser($actor)['canStartNextDay']);
            }
            $this->actingAs($this->owner)->withSession([WorkspaceAccess::SESSION_KEY => 'staff'])->postJson('/api/commands', ['action' => 'day.next', 'input' => []], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
            $this->assertSame(2, DB::table('business_days')->count());
            $this->assertSame(1, DB::table('audit_logs')->where('action', 'day.next')->count());

            for ($i = 0; $i < 2; $i++) {
                $this->assertTrue(app(Projection::class)->forUser($this->owner)['canStartNextDay']);
                $this->runCommand('day.next', [], $this->owner);
                $this->runCommand('day.open', ['actual' => '2000000'], $this->clerk);
                $receipt = $this->runCommand('receipt.create', ['party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '100']]], $this->clerk);
                $this->assertSame(DB::table('business_days')->max('business_date'), R::get('documents', $receipt['document_id'])->business_date);
                if ($i === 0) {
                    $this->runCommand('day.close', $close, $this->clerk);
                }
            }
            $this->assertFalse(app(Projection::class)->forUser($this->clerk)['closed']);
            $this->assertSame(4, DB::table('business_days')->count());
            $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        } finally {
            $this->travelBack();
        }
    }

    public function test_clerk_rollover_allowance_resets_at_yangon_midnight(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-29T17:29:59Z'));
        try {
            $close = ['actual' => '2000000', 'confirmed' => true];
            $this->runCommand('day.close', $close, $this->clerk);
            $this->runCommand('day.next', [], $this->owner);
            $this->assertFalse(app(BusinessService::class)->canStartNextDay($this->clerk));
            $this->runCommand('day.open', ['actual' => '2000000'], $this->clerk);
            $this->runCommand('day.close', $close, $this->clerk);
            $this->travelTo(CarbonImmutable::parse('2026-10-29T17:30:01Z'));
            $this->assertTrue(app(BusinessService::class)->canStartNextDay($this->clerk));
            $this->runCommand('day.next', [], $this->clerk);
            $this->assertFalse(app(BusinessService::class)->canStartNextDay($this->clerk));
            $this->assertSame(3, DB::table('business_days')->count());
        } finally {
            $this->travelBack();
        }
    }

    public function test_daily_close_next_day_preserves_unfinished_work(): void
    {
        $this->receive();
        $this->sale();
        $this->runCommand('day.close', ['actual' => '2000000', 'transfer' => '100000', 'confirmed' => true]);
        $this->runCommand('day.next');
        $this->assertSame('2026-10-26', DB::table('business_days')->max('business_date'));
        $this->equalDecimal('1500', DB::table('stock_lots')->sum('quantity'));
        $this->equalDecimal('500000', DB::table('documents')->where('kind', 'sale')->value('net'));
    }

    public function test_clerk_cannot_fund_or_read_hidden_accounts(): void
    {
        $state = app(Projection::class)->forUser($this->clerk);
        $this->assertArrayNotHasKey('home', $state['bases']);
        $this->assertNotContains('home', array_column($state['masters']['accounts'], 'id'));
        try {
            $this->runCommand('cash.fund', ['amount' => '10', 'destination_id' => $this->cash->id, 'description' => 'Capital', 'confirmed' => true], $this->clerk);
            $this->fail('Clerk funding was allowed.');
        } catch (HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
        }
    }

    public function test_transaction_failure_rolls_back_documents_lots_and_cash(): void
    {
        $r = $this->receive();
        $docs = DB::table('documents')->count();
        try {
            $this->purchase($r['line_ids'][0], ['payments' => [['account_id' => $this->cash->id, 'amount' => '999999999']]]);
            $this->fail('Overpayment accepted.');
        } catch (ValidationException) {
        }
        $this->assertSame($docs, DB::table('documents')->count());
        $this->assertSame('supplier', $this->lot()->owner);
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_duplicate_requests_post_exactly_once(): void
    {
        $this->receive();
        $key = (string) Str::uuid();
        $input = ['party_id' => $this->buyer->id, 'delivery' => 'direct', 'lines' => [['lot_id' => $this->lot()->id, 'quantity' => '500', 'price' => '1000']]];
        $one = $this->runCommand('sale.create', $input, null, $key);
        $two = $this->runCommand('sale.create', $input, null, $key);
        $this->assertSame($one, $two);
        $this->equalDecimal('1000', DB::table('stock_lots')->sum('quantity'));
    }

    public function test_same_request_key_with_changed_intent_is_rejected(): void
    {
        $key = (string) Str::uuid();
        $this->runCommand('note.save', ['title' => 'First', 'body' => 'One'], null, $key);
        $this->expectException(HttpException::class);
        $this->runCommand('note.save', ['title' => 'Second', 'body' => 'Two'], null, $key);
    }

    public function test_cash_reversal_restores_original_balances_once(): void
    {
        $f = $this->runCommand('cash.fund', ['mode' => 'transfer', 'source_id' => $this->home->id, 'destination_id' => $this->cash->id, 'amount' => '50000', 'description' => 'Working cash', 'confirmed' => true]);
        $this->runCommand('cash.reverse', ['document_id' => $f['document_id'], 'reason' => 'Correction']);
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('500000', R::get('cash_accounts', $this->home->id)->balance);
    }

    public function test_exact_standard_bag_pricing_and_signed_adjustments(): void
    {
        $r = $this->receive('1000');
        $add = R::insert('adjustment_rates', ['name' => 'Add', 'kind' => 'purchase', 'item_type' => 'custom', 'calc_mode' => 'manual']);
        $sub = R::insert('adjustment_rates', ['name' => 'Subtract', 'kind' => 'purchase', 'item_type' => 'custom', 'calc_mode' => 'manual']);
        $service = R::insert('adjustment_rates', ['name' => 'Service', 'kind' => 'purchase', 'item_type' => 'service', 'calc_mode' => 'service_percent', 'rate' => '1']);
        $p = $this->runCommand('purchase.create', ['lines' => [['receipt_line_id' => $r['line_ids'][0], 'price' => '20000', 'basis' => 'standard_bag']], 'adjustments' => [['rate_id' => $add->id, 'amount' => '5000', 'direction' => 'add'], ['rate_id' => $sub->id, 'amount' => '3000', 'direction' => 'subtract'], ['rate_id' => $service->id]]]);
        $this->equalDecimal('794000', R::get('documents', $p['document_id'])->net);
    }

    public function test_purchase_service_fee_respects_selected_direction_and_keeps_the_posted_snapshot(): void
    {
        $service = R::insert('adjustment_rates', ['name' => 'Service', 'kind' => 'purchase', 'item_type' => 'service', 'calc_mode' => 'service_percent', 'rate' => '2']);
        $manual = R::insert('adjustment_rates', ['name' => 'Manual addition', 'kind' => 'purchase', 'item_type' => 'custom', 'calc_mode' => 'manual']);
        foreach (['add', 'subtract', null] as $direction) {
            $receipt = $this->receive('100');
            $adjustment = ['rate_id' => $service->id, 'amount' => '1'];
            if ($direction !== null) {
                $adjustment['direction'] = $direction;
            }
            $purchase = $this->purchase($receipt['line_ids'][0], ['adjustments' => [$adjustment, ['rate_id' => $manual->id, 'amount' => '500', 'direction' => 'add']]]);
            $doc = R::get('documents', $purchase['document_id']);
            $fee = R::details($doc)['charges']['items'][0];
            $this->equalDecimal('1600', $fee['amount']);
            $this->assertSame($direction ?? 'subtract', $fee['direction']);
            $this->equalDecimal($direction === 'add' ? '82100' : '78900', $doc->net);
            $state = app(Projection::class)->forUser($this->owner);
            $saved = collect($state['receipts'])->firstWhere('purchaseDocumentId', $doc->id)['charges4'];
            $this->assertSame($direction ?? 'subtract', $saved['serviceDirection']);
            $this->assertCount(1, $saved['purchaseAdjustments2']['additionRows']);
            $this->equalDecimal($direction === 'add' ? '2100' : '500', $saved['purchaseAdjustments2']['additionTotal']);
        }
        R::update('adjustment_rates', $service->id, ['rate' => '5']);
        $this->equalDecimal('1600', R::details(R::get('documents', $doc->id))['charges']['items'][0]['amount']);
        $this->assertSame(0, DB::table('cash_entries')->count());
    }

    public function test_purchase_uses_persisted_labor_masters_and_rejects_invalid_choices(): void
    {
        DB::table('labor_rates')->delete();
        $rate = R::insert('labor_rates', ['name' => 'Handling rate', 'kind' => 'rate', 'rate' => '500']);
        $mael = R::insert('labor_rates', ['name' => 'Two handling', 'kind' => 'mael', 'rate' => '2']);
        $receipt = $this->receive('100');
        $input = ['lines' => [['receipt_line_id' => $receipt['line_ids'][0], 'price' => '800', 'basis' => 'viss']], 'labor' => [['labor_rate_id' => $rate->id, 'mael_id' => 'LM51-1', 'bags' => '4']]];
        $this->actingAs($this->clerk)->postJson('/api/commands', ['action' => 'purchase.create', 'input' => $input], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable()->assertJsonValidationErrors('labor');
        $input['labor'][0]['mael_id'] = $mael->id;
        R::update('labor_rates', $mael->id, ['active' => false]);
        $this->postJson('/api/commands', ['action' => 'purchase.create', 'input' => $input], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable()->assertJsonValidationErrors('labor');
        $this->assertSame(0, DB::table('documents')->where('kind', 'purchase')->count());
        $this->assertSame('supplier', $this->lot()->owner);
        R::update('labor_rates', $mael->id, ['active' => true]);
        $purchase = $this->runCommand('purchase.create', $input, $this->clerk);
        $this->equalDecimal('76000', R::get('documents', $purchase['document_id'])->net);
        $this->assertSame(1, DB::table('documents')->where('kind', 'purchase')->count());
    }

    public function test_service_rates_have_separate_crud_and_keep_posted_charges(): void
    {
        $input = ['kind' => 'service_rate', 'data' => ['name' => 'Service fee', 'kind' => 'both', 'rate' => '1.25']];
        $id = $this->runCommand('master.save', $input, $this->clerk)['id'];
        $this->assertSame('service_percent', R::get('adjustment_rates', $id)->calc_mode);
        $input['id'] = $id;
        $input['data']['rate'] = '2.5';
        $this->runCommand('master.save', $input, $this->clerk);
        $receipt = $this->receive('1000');
        $purchase = $this->purchase($receipt['line_ids'][0], ['adjustments' => [['rate_id' => $id]]]);
        $this->equalDecimal('780000', R::get('documents', $purchase['document_id'])->net);
        $input['data']['rate'] = '5';
        $this->runCommand('master.save', $input);
        $this->equalDecimal('780000', R::get('documents', $purchase['document_id'])->net);
        $this->runCommand('master.inactivate', ['kind' => 'service_rate', 'id' => $id]);
        $this->assertFalse((bool) R::get('adjustment_rates', $id)->active);
        $input['data']['active'] = true;
        $this->runCommand('master.save', $input);
        $this->assertTrue((bool) R::get('adjustment_rates', $id)->active);
    }

    public function test_service_rate_validation_and_category_boundaries(): void
    {
        $this->actingAs($this->owner);
        $service = $this->runCommand('master.save', ['kind' => 'service_rate', 'data' => ['name' => 'Service', 'kind' => 'both', 'rate' => '1']])['id'];
        $manual = $this->runCommand('master.save', ['kind' => 'adjustment', 'data' => ['name' => 'Manual', 'kind' => 'both', 'calcMode' => 'manual']])['id'];
        foreach ([
            ['kind' => 'service_rate', 'data' => ['name' => 'Invalid', 'kind' => 'both', 'rate' => '101']],
            ['kind' => 'adjustment', 'data' => ['name' => 'Service', 'kind' => 'both', 'calcMode' => 'service_percent', 'rate' => '1']],
            ['kind' => 'adjustment', 'id' => $service, 'data' => ['name' => 'Changed', 'kind' => 'both', 'calcMode' => 'manual']],
            ['kind' => 'service_rate', 'id' => $manual, 'data' => ['name' => 'Changed', 'kind' => 'both', 'rate' => '1']],
        ] as $input) {
            $this->postJson('/api/commands', ['action' => 'master.save', 'input' => $input], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        }
        foreach ([['kind' => 'adjustment', 'id' => $service], ['kind' => 'service_rate', 'id' => $manual]] as $input) {
            $this->postJson('/api/commands', ['action' => 'master.inactivate', 'input' => $input], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        }
        $this->assertSame('service_percent', R::get('adjustment_rates', $service)->calc_mode);
        $this->assertTrue((bool) R::get('adjustment_rates', $service)->active);
        $this->assertTrue((bool) R::get('adjustment_rates', $manual)->active);
    }

    public function test_default_account_seeding_supports_login_and_separate_owner_entry_without_resetting_passwords(): void
    {
        $this->seed();
        $defaultOwner = User::where('email', 'owner@pweyon.local')->firstOrFail();
        $this->assertSame('owner', $defaultOwner->role);
        $this->assertTrue($defaultOwner->active);
        $this->assertTrue(Hash::check('Pweyon@123456', $defaultOwner->password));
        $this->assertTrue(Hash::check('Owner@123456', $defaultOwner->owner_view_password));

        $this->post('/login', ['email' => 'owner@pweyon.local', 'password' => 'Pweyon@123456'])->assertRedirect('/');
        $this->assertAuthenticatedAs($defaultOwner);
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'Pweyon@123456'])->assertUnprocessable();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'Owner@123456'])->assertOk();
        $defaultOwner->password = 'Changed-login!123';
        $defaultOwner->owner_view_password = 'Changed-owner!123';
        $defaultOwner->save();
        $credentials = $defaultOwner->fresh()->only(['password', 'owner_view_password']);
        $this->seed();

        $this->assertSame($credentials, $defaultOwner->fresh()->only(['password', 'owner_view_password']));
        $this->assertSame(3, User::count());
        $this->assertTrue($this->owner->fresh()->active);
    }

    public function test_default_account_seeding_does_not_promote_or_reset_an_existing_matching_account(): void
    {
        $this->clerk->email = 'owner@pweyon.local';
        $this->clerk->active = false;
        $this->clerk->save();
        $before = $this->clerk->fresh()->getAttributes();

        $this->seed();

        $this->assertSame($before, $this->clerk->fresh()->getAttributes());
        $this->assertSame(2, User::count());
    }

    public function test_login_requires_real_credentials_and_api_requires_session(): void
    {
        $this->get('/')->assertRedirect('/login');
        $this->getJson('/api/state')->assertUnauthorized();
        $this->post('/login', ['email' => $this->owner->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->actingAs($this->clerk)->getJson('/api/state')->assertOk()->assertJsonMissing(['id' => 'home']);
    }

    public function test_workspace_downgrade_needs_no_password_and_blocks_owner_data_and_commands(): void
    {
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'staff'])
            ->assertOk()->assertJsonPath('state.role', 'staff')->assertJsonPath('state.actorRole', 'owner');
        $this->getJson('/api/state')->assertOk()->assertJsonPath('role', 'staff')->assertJsonMissing(['id' => 'home']);
        $this->get('/')->assertOk();
        $this->getJson('/api/reports/profit?from=2026-10-25&to=2026-10-25')->assertForbidden();
        $this->postJson('/api/commands', ['action' => 'cash.fund', 'input' => ['amount' => '1', 'role' => 'owner']], ['Idempotency-Key' => (string) Str::uuid()])->assertForbidden();
        $this->assertSame('owner', $this->owner->fresh()->role);
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_owner_login_always_starts_in_staff_view_and_requires_owner_password(): void
    {
        $this->withSession(['url.intended' => '/api/account', WorkspaceAccess::SESSION_KEY => 'owner'])
            ->post('/login', ['email' => $this->owner->email, 'password' => 'password'])
            ->assertRedirect('/')->assertSessionHas(WorkspaceAccess::SESSION_KEY, 'staff');
        $this->getJson('/api/state')->assertOk()->assertJsonPath('role', 'staff')
            ->assertJsonPath('actorRole', 'owner')->assertJsonMissing(['id' => 'home']);
        $this->getJson('/api/account')->assertForbidden();
        $this->getJson('/api/reports/profit?from=2026-10-25&to=2026-10-25')->assertForbidden();
        $this->postJson('/api/workspace/view', ['view' => 'owner'])->assertUnprocessable();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])
            ->assertOk()->assertJsonPath('state.role', 'owner');
        $this->post('/logout')->assertRedirect('/login');
        $this->post('/login', ['email' => $this->owner->email, 'password' => 'password'])
            ->assertRedirect('/')->assertSessionHas(WorkspaceAccess::SESSION_KEY, 'staff');
        $this->getJson('/api/state')->assertJsonPath('role', 'staff');
    }

    public function test_clerk_login_starts_in_staff_view(): void
    {
        $this->post('/login', ['email' => $this->clerk->email, 'password' => 'password'])
            ->assertRedirect('/')->assertSessionHas(WorkspaceAccess::SESSION_KEY, 'staff');
        $this->getJson('/api/state')->assertOk()->assertJsonPath('role', 'staff')->assertJsonPath('actorRole', 'staff');
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertForbidden();
    }

    public function test_workspace_owner_entry_requires_the_current_password(): void
    {
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->postJson('/api/workspace/view', ['view' => 'owner'])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'incorrect'])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->getJson('/api/state')->assertJsonPath('role', 'staff')->assertJsonMissing(['id' => 'home']);
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])
            ->assertOk()->assertJsonPath('state.role', 'owner')->assertJsonStructure(['csrfToken']);
        $this->getJson('/api/state')->assertJsonPath('role', 'owner')->assertJsonFragment(['id' => 'home']);
        $this->getJson('/api/reports/profit?from=2026-10-25&to=2026-10-25')->assertOk();
    }

    public function test_workspace_cannot_replay_owner_commands_while_in_staff_view(): void
    {
        $key = (string) Str::uuid();
        $input = ['kind' => 'account', 'data' => ['name' => 'Private Account', 'type' => 'cash', 'staffCanView' => false]];
        $this->runCommand('master.save', $input, $this->owner, $key);
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->postJson('/api/commands', ['action' => 'master.save', 'input' => $input], ['Idempotency-Key' => $key])->assertForbidden();
        $this->assertSame(3, DB::table('cash_accounts')->count());
    }

    public function test_workspace_requires_password_again_after_each_return_to_staff(): void
    {
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertOk();
        $this->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'incorrect'])->assertUnprocessable();
        $this->getJson('/api/state')->assertJsonPath('role', 'staff');
    }

    public function test_workspace_clerk_and_guest_cannot_enter_owner_view(): void
    {
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertUnauthorized();
        $this->actingAs($this->clerk)->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password', 'role' => 'owner'])->assertForbidden();
        $this->getJson('/api/state')->assertJsonPath('role', 'staff')->assertJsonPath('actorRole', 'staff');
        $this->assertSame('clerk', $this->clerk->fresh()->role);
    }

    public function test_workspace_password_attempts_are_limited_without_blocking_downgrade(): void
    {
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertStatus(429)->assertHeader('Retry-After');
        $this->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk()->assertJsonPath('state.role', 'staff');
    }

    public function test_account_can_change_email_and_login_password_without_changing_owner_entry(): void
    {
        $this->actingAs($this->owner)->postJson('/api/account', [
            'email' => 'updated-owner@example.test',
            'password' => 'NewLogin-123!',
        ])->assertOk();
        $this->owner->refresh();
        $this->assertTrue(Hash::check('password', $this->owner->owner_view_password));
        $this->post('/logout')->assertRedirect('/login');
        $this->post('/login', ['email' => 'updated-owner@example.test', 'password' => 'password'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => 'updated-owner@example.test', 'password' => 'NewLogin-123!'])->assertRedirect('/');
        $this->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'NewLogin-123!'])->assertUnprocessable();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertOk();
    }

    public function test_account_owner_entry_password_changes_independently_and_is_hidden(): void
    {
        $originalHash = $this->owner->password;
        $this->actingAs($this->owner)->getJson('/api/account')->assertOk()->assertExactJson(['email' => $this->owner->email]);
        $this->postJson('/api/account/owner-password', [
            'owner_view_password' => ' OwnerGate-123! ',
        ])->assertOk();
        $this->owner->refresh();
        $this->assertSame($originalHash, $this->owner->password);
        $this->assertArrayNotHasKey('owner_view_password', $this->owner->toArray());
        $this->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertUnprocessable();
        $this->postJson('/api/workspace/view', ['view' => 'owner', 'password' => ' OwnerGate-123! '])->assertOk();
        $this->assertSame($this->owner->email, $this->owner->fresh()->email);
    }

    public function test_account_changes_require_owner_view_and_active_owner(): void
    {
        $this->getJson('/api/account')->assertUnauthorized();
        $this->postJson('/api/account', [])->assertUnauthorized();
        $this->postJson('/api/account/owner-password', [])->assertUnauthorized();
        $this->actingAs($this->clerk)->getJson('/api/account')->assertForbidden();
        $this->postJson('/api/account', [])->assertForbidden();
        $this->postJson('/api/account/owner-password', [])->assertForbidden();
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'staff'])->assertOk();
        $this->getJson('/api/account')->assertForbidden();
        $this->postJson('/api/account', [])->assertForbidden();
        $this->postJson('/api/account/owner-password', [])->assertForbidden();
        $this->owner->active = false;
        $this->owner->save();
        $this->withSession([WorkspaceAccess::SESSION_KEY => 'owner'])->getJson('/api/account')->assertForbidden();
    }

    public function test_account_validation_leaves_credentials_unchanged(): void
    {
        $email = $this->owner->email;
        $hash = $this->owner->password;
        $this->actingAs($this->owner)->postJson('/api/account', [
            'email' => $this->clerk->email, 'password' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/api/account/owner-password', ['owner_view_password' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors('owner_view_password');
        $this->postJson('/api/account', [
            'email' => 'changed@example.test', 'owner_view_password' => 'SeparateGate-123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('owner_view_password');
        $this->postJson('/api/account/owner-password', [
            'owner_view_password' => 'SeparateGate-123!', 'email' => 'changed@example.test', 'password' => 'NewLogin-123!',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->owner->refresh();
        $this->assertSame($email, $this->owner->email);
        $this->assertSame($hash, $this->owner->password);
        $this->assertNull($this->owner->owner_view_password);
    }

    public function test_account_blank_passwords_preserve_both_existing_hashes(): void
    {
        $this->owner->owner_view_password = 'SeparateGate-123!';
        $this->owner->save();
        $loginHash = $this->owner->password;
        $gateHash = $this->owner->owner_view_password;
        $this->actingAs($this->owner)->postJson('/api/account', [
            'email' => $this->owner->email, 'password' => '',
        ])->assertOk();
        $this->owner->refresh();
        $this->assertSame($loginHash, $this->owner->password);
        $this->assertSame($gateHash, $this->owner->owner_view_password);
    }

    public function test_account_updates_are_rate_limited(): void
    {
        $this->actingAs($this->owner);
        $data = ['email' => 'invalid-email'];
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->postJson('/api/account', $data)->assertUnprocessable();
        }
        $this->postJson('/api/account', $data)->assertStatus(429);
    }

    public function test_workspace_inactive_owner_is_rejected(): void
    {
        $this->owner->active = false;
        $this->owner->save();
        $this->actingAs($this->owner)->postJson('/api/workspace/view', ['view' => 'owner', 'password' => 'password'])->assertForbidden();
    }

    public function test_original_interface_renders_with_server_stock_and_session(): void
    {
        $this->receive();
        $this->sale();
        $response = $this->actingAs($this->owner)->get('/');
        $response->assertOk();
        $response->assertSee('server-bridge.js');
    }

    public function test_competing_stock_and_payment_operations_on_independent_connections(): void
    {
        $this->assertSame(2, DB::table('users')->count(), 'Concurrency test requires an otherwise empty disposable database.');
        $this->receive();
        $lot = $this->lot();
        DB::commit();
        $race = function (string $action, array $input, bool $sameKey = false): array {
            $key = (string) Str::uuid();
            $start = microtime(true) + 0.7;
            $workers = [];
            for ($i = 0; $i < 2; $i++) {
                $p = new Process([PHP_BINARY, base_path('tests/Support/command-worker.php')], base_path(), ['APP_ENV' => 'testing']);
                $p->setInput(json_encode(['actor' => $this->owner->id, 'action' => $action, 'input' => $input, 'key' => $sameKey ? $key : (string) Str::uuid(), 'start' => $start]));
                $p->start();
                $workers[] = $p;
            }

            return array_map(function ($p) {
                $p->wait();
                $this->assertSame(0, $p->getExitCode(), $p->getErrorOutput());

                return json_decode($p->getOutput(), true, 512, JSON_THROW_ON_ERROR);
            }, $workers);
        };
        try {
            $result = $race('sale.create', ['party_id' => $this->buyer->id, 'delivery' => 'direct', 'lines' => [['lot_id' => $lot->id, 'quantity' => '900', 'price' => '1000']]]);
            $this->assertSame(1, count(array_filter($result, fn ($r) => $r['ok'])));
            $this->equalDecimal('600', R::get('stock_lots', $lot->id)->quantity);
            $sale = DB::table('documents')->where('kind', 'sale')->first();
            $result = $race('payment.create', ['document_id' => $sale->id, 'payments' => [['account_id' => $this->cash->id, 'amount' => '600000']]]);
            $this->assertSame(1, count(array_filter($result, fn ($r) => $r['ok'])));
            $this->equalDecimal('600000', R::get('documents', $sale->id)->paid);
            $result = $race('sale.create', ['party_id' => $this->buyer->id, 'delivery' => 'direct', 'lines' => [['lot_id' => $lot->id, 'quantity' => '100', 'price' => '1000']]], true);
            $this->assertSame(2, count(array_filter($result, fn ($r) => $r['ok'])));
            $this->equalDecimal('500', R::get('stock_lots', $lot->id)->quantity);
            $this->assertSame($result[0]['result'], $result[1]['result']);
        } finally {
            // Only this guarded, dedicated disposable database contains these fixtures.
            DB::transaction(function () {
                foreach (['command_receipts', 'audit_logs', 'recoveries', 'payment_allocations', 'payments', 'stock_checks', 'stock_events'] as $table) {
                    DB::table($table)->delete();
                }
                foreach (DB::table('cash_entries')->orderByDesc('id')->get() as $r) {
                    DB::table('cash_entries')->where('id', $r->id)->delete();
                }
                foreach (DB::table('stock_lots')->orderByDesc('id')->get() as $r) {
                    DB::table('stock_lots')->where('id', $r->id)->delete();
                }
                foreach (DB::table('document_lines')->orderByDesc('id')->get() as $r) {
                    DB::table('document_lines')->where('id', $r->id)->delete();
                }
                foreach (DB::table('documents')->orderByDesc('id')->get() as $r) {
                    DB::table('documents')->where('id', $r->id)->delete();
                }
                foreach (['daily_prices', 'package_types', 'cash_accounts', 'warehouses', 'products', 'partners', 'business_days', 'operation_locks', 'funding_categories', 'labor_rates', 'users'] as $table) {
                    DB::table($table)->delete();
                }
            });
        }
    }

    public function test_server_reports_reconcile_stock_statement_and_provisional_profit(): void
    {
        $r = $this->receive();
        $s = $this->sale();
        $this->purchase($r['line_ids'][0]);
        $this->runCommand('dispatch.create', ['lot_id' => $this->lot('customer')->id, 'quantity' => '100']);
        $reports = app(Reports::class);
        $stock = $reports->stock($this->owner, '2026-10-25', '2026-10-25');
        $this->equalDecimal('1400', $stock['groups'][0]['closing']);
        $this->equalDecimal('1500', $stock['groups'][0]['physicalIn']);
        $this->equalDecimal('100', $stock['groups'][0]['physicalOut']);
        $statement = $reports->statement($this->owner, $this->trader->id, '2026-10-25', '2026-10-25');
        $this->equalDecimal('1300000', $statement['payable']);
        $profit = $reports->profit($this->owner, '2026-10-25', '2026-10-25');
        $this->equalDecimal('500000', $profit['supplierGross']);
        $this->equalDecimal('0', $profit['ownedRevenue']);
        $this->equalDecimal('0', $profit['netProfit']);
        $this->actingAs($this->clerk)->getJson('/api/reports/profit?from=2026-10-25&to=2026-10-25')->assertForbidden();
    }

    public function test_opening_approval_and_buyer_dispatch_do_not_create_sales_or_cash(): void
    {
        $draft = ['schema' => 1, 'status' => 'draft', 'startDate' => '2026-10-25', 'accounts' => ['cash' => ['amount' => '2000000', 'checked' => true], 'home' => ['amount' => '500000', 'checked' => true]], 'own' => ['checked' => true, 'rows' => []], 'groups' => ['supplier' => true, 'buyer' => true], 'parties' => [(string) $this->buyer->id => ['checked' => true, 'values' => [], 'rows' => [['productId' => (string) $this->product->id, 'warehouse' => (string) $this->warehouse->id, 'grade' => 'A', 'batch' => 'Opening buyer stock', 'qty' => '200', 'bags' => '']]]]];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $this->runCommand('opening.approve');
        $lot = $this->lot('customer');
        $this->runCommand('opening.dispatch', ['lot_id' => $lot->id, 'quantity' => '50']);
        $this->equalDecimal('150', R::get('stock_lots', $lot->id)->quantity);
        $this->assertSame(0, DB::table('documents')->where('kind', 'sale')->count());
        $this->assertSame(0, DB::table('cash_entries')->count());
    }

    public function test_opening_approval_ignores_null_slots_and_untouched_party_placeholders(): void
    {
        $draft = ['startDate' => '2026-10-25', 'accounts' => ['cash' => ['amount' => '2000000', 'checked' => true], 'home' => ['amount' => '500000', 'checked' => true]], 'own' => ['checked' => true, 'rows' => []], 'groups' => ['supplier' => true, 'buyer' => true], 'parties' => [
            null,
            ['answers' => ['stock' => null], 'rows' => [], 'values' => ['loan' => '', 'loanRate' => '3'], 'checked' => false],
            (string) $this->buyer->id => ['checked' => true, 'answers' => ['receivable' => 'yes'], 'values' => ['receivable' => '25000'], 'rows' => []],
        ]];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $this->runCommand('opening.approve');
        $this->assertSame('approved', DB::table('documents')->where('kind', 'opening')->value('status'));
        $this->assertSame(1, DB::table('documents')->where('kind', 'opening_receivable')->count());
        $this->equalDecimal('25000', DB::table('documents')->where('kind', 'opening_receivable')->value('net'));
        $this->assertSame(0, DB::table('stock_lots')->count());
    }

    public function test_opening_approval_still_rejects_unreviewed_real_values(): void
    {
        $draft = ['accounts' => ['cash' => ['amount' => '123', 'checked' => true], 'home' => ['amount' => '456', 'checked' => true]], 'own' => ['checked' => true, 'rows' => []], 'groups' => ['supplier' => true, 'buyer' => true], 'parties' => [(string) $this->buyer->id => ['checked' => false, 'answers' => ['stock' => null], 'values' => ['receivable' => '25000'], 'rows' => []]]];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $this->actingAs($this->owner)->postJson('/api/commands', ['action' => 'opening.approve', 'input' => []], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        $this->assertSame('draft', DB::table('documents')->where('kind', 'opening')->value('status'));
        $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->assertSame(0, DB::table('documents')->where('kind', 'opening_receivable')->count());
    }

    public function test_receipt_from_closed_date_can_be_corrected_without_reopening_or_duplicating_stock(): void
    {
        $r = $this->receive('300');
        $lotId = $this->lot()->id;
        $this->runCommand('day.close', ['actual' => '2000000', 'transfer' => '0', 'confirmed' => true]);
        $closing = DB::table('business_days')->where('business_date', '2026-10-25')->value('closing');
        $this->runCommand('day.next');
        $this->runCommand('day.open', ['actual' => '2000000']);
        $input = ['document_id' => $r['document_id'], 'date' => '2026-10-25', 'note' => 'Historical receipt correction', 'lines' => [['id' => $r['line_ids'][0], 'quantity' => '350', 'bag_type' => 'weight']]];
        $key = (string) Str::uuid();
        $response = $this->actingAs($this->clerk)->postJson('/api/commands', ['action' => 'receipt.edit', 'input' => $input], ['Idempotency-Key' => $key])->assertOk();
        $first = $response->json('result');
        $this->assertSame($first, $this->runCommand('receipt.edit', $input, $this->clerk, $key));
        $this->assertSame($lotId, $this->lot()->id);
        $this->equalDecimal('350', $this->lot()->quantity);
        $doc = R::get('documents', $r['document_id']);
        $this->assertSame('2026-10-25', $doc->business_date);
        $this->assertSame('Historical receipt correction', $doc->note);
        $this->assertSame('closed', DB::table('business_days')->where('business_date', '2026-10-25')->value('status'));
        $this->assertSame($closing, DB::table('business_days')->where('business_date', '2026-10-25')->value('closing'));
        $this->assertSame(1, DB::table('stock_events')->where('kind', 'receipt_correction')->count());
        $this->assertSame(0, DB::table('cash_entries')->count());
        foreach (['2026-10-25', '2026-10-27', '2026-02-30'] as $date) {
            try {
                if ($date === '2026-10-25') {
                    $this->runCommand('receipt.create', ['date' => $date, 'party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '1']]]);
                } else {
                    $this->runCommand('receipt.edit', array_replace($input, ['date' => $date]));
                }
                $this->fail('Invalid or closed new-posting date was accepted.');
            } catch (ValidationException $e) {
                $this->assertNotEmpty($e->errors());
            }
        }
        $this->equalDecimal('350', $this->lot()->quantity);
    }

    public function test_receipt_edits_keep_identity_and_refuse_sold_line_changes(): void
    {
        $r = $this->receive('300');
        $lot = $this->lot();
        $this->runCommand('receipt.edit', ['document_id' => $r['document_id'], 'lines' => [['id' => $r['line_ids'][0], 'quantity' => '350', 'bag_type' => 'weight']]]);
        $this->equalDecimal('350', R::get('stock_lots', $lot->id)->quantity);
        $this->sale('50', 'hold');
        $this->expectException(ValidationException::class);
        $this->runCommand('receipt.edit', ['document_id' => $r['document_id'], 'lines' => [['id' => $r['line_ids'][0], 'quantity' => '400', 'bag_type' => 'weight']]]);
    }

    public function test_mysql_foreign_keys_and_nonnegative_constraints_are_enforced(): void
    {
        try {
            DB::table('cash_accounts')->where('id', $this->cash->id)->update(['balance' => '-1']);
            $this->fail('Negative balance was accepted.');
        } catch (QueryException $e) {
            $this->assertStringContainsString('cash_balance_nonnegative', $e->getMessage());
        }
        try {
            R::insert('package_types', ['product_id' => 99999999, 'name' => 'Invalid product', 'size' => '10']);
            $this->fail('Broken foreign key was accepted.');
        } catch (QueryException $e) {
            $this->assertSame('23000', $e->errorInfo[0]);
        }
    }

    public function test_next_day_collection_records_the_actual_collection_business_date(): void
    {
        $this->receive();
        $sale = $this->sale();
        $this->runCommand('day.close', ['actual' => '2000000', 'transfer' => '0', 'confirmed' => true]);
        $this->runCommand('day.next');
        $this->runCommand('day.open', ['actual' => '2000000']);
        $this->runCommand('payment.create', ['document_id' => $sale['document_id'], 'payments' => [['account_id' => $this->cash->id, 'amount' => '100000']]]);
        $this->assertSame('2026-10-26', DB::table('cash_entries')->value('business_date'));
        $this->assertSame('2026-10-26', DB::table('payments')->value('business_date'));
        $this->assertSame('2026-10-25', R::get('documents', $sale['document_id'])->business_date);
    }

    public function test_closing_snapshot_survives_next_day_changes_and_hides_accounts(): void
    {
        $r = $this->receive();
        $this->sale();
        $this->purchase($r['line_ids'][0]);
        $held = $this->lot('customer');
        $this->runCommand('day.close', ['actual' => '2000000', 'transfer' => '100000', 'confirmed' => true]);
        $this->runCommand('day.next');
        $this->runCommand('day.open', ['actual' => '1900000']);
        $this->runCommand('dispatch.create', ['lot_id' => $held->id, 'quantity' => '100']);
        $state = app(Projection::class)->forUser($this->owner);
        $snapshot = $state['days'][0]['closing']['summary53'];
        $this->equalDecimal('500', $snapshot['inventory']['ownership']['customer']['qty']);
        $this->equalDecimal('400', R::get('stock_lots', $held->id)->quantity);
        $this->equalDecimal('800000', $snapshot['purchases']['gross']);
        $clerk = app(Projection::class)->forUser($this->clerk);
        $this->assertNotContains('home', array_column($clerk['days'][0]['closing']['summary53']['accounts'], 'id'));
        $this->actingAs($this->owner)->get('/')->assertOk();
    }

    public function test_historical_master_setup_and_daily_market_prices_persist(): void
    {
        $product = $this->runCommand('master.save', ['kind' => 'product', 'data' => ['name' => 'ပဲ', 'standardViss' => '25', 'grades' => ['A', 'B', 'C']]], $this->clerk);
        $supplier = $this->runCommand('master.save', ['kind' => 'partner', 'data' => ['name' => 'ဦးလှ', 'locality' => 'Town', 'phone' => '123', 'kind' => 'supplier']], $this->clerk);
        $buyer = $this->runCommand('master.save', ['kind' => 'partner', 'data' => ['name' => 'ဦးဘ', 'locality' => 'Town', 'kind' => 'buyer']], $this->clerk);
        $account = $this->runCommand('master.save', ['kind' => 'account', 'data' => ['name' => 'New Bank', 'type' => 'bank', 'openingBalance' => '70000', 'staffCanView' => false]]);
        $this->runCommand('master.save', ['kind' => 'account', 'id' => $account['id'], 'data' => ['name' => 'Renamed Bank', 'type' => 'bank', 'active' => true, 'staffCanView' => false]]);
        $reason = $this->runCommand('master.save', ['kind' => 'expense_reason', 'data' => ['name' => 'Electricity']], $this->clerk);
        $this->runCommand('master.save', ['kind' => 'expense_reason', 'id' => $reason['id'], 'data' => ['name' => 'Electricity bill']], $this->clerk);
        $this->runCommand('prices.save', ['prices' => [['product_id' => $product['id'], 'grade' => 'A', 'price' => '20000']]], $this->clerk);
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertSame('2026-10-25', $state['priceDate']);
        $this->equalDecimal('20000', $state['prices']['ပဲ|A']);
        $this->assertContains('Electricity bill', array_column($state['masters']['expenseReasons'], 'name'));
        $clerk = app(Projection::class)->forUser($this->clerk);
        $this->assertNotContains('Renamed Bank', array_column($clerk['masters']['accounts'], 'name'));
        $this->equalDecimal('70000', R::get('cash_accounts', $account['id'])->balance);
        $this->assertSame(0, DB::table('cash_entries')->count());
    }

    public function test_historical_home_payment_and_self_transfer_are_rejected_clearly(): void
    {
        $r = $this->receive('300');
        $p = $this->purchase($r['line_ids'][0]);
        try {
            $this->runCommand('payment.create', ['document_id' => $p['document_id'], 'payments' => [['account_id' => $this->home->id, 'amount' => '1000']]]);
            $this->fail('Home was accepted as a daily payment account.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('Home money', $e->getMessage());
        }
        try {
            $this->runCommand('cash.fund', ['mode' => 'transfer', 'source_id' => $this->home->id, 'destination_id' => $this->home->id, 'amount' => '1000', 'description' => 'Invalid self transfer', 'confirmed' => true]);
            $this->fail('Self transfer was accepted.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('differ', $e->getMessage());
        }
        $this->assertSame(0, DB::table('cash_entries')->count());
    }

    public function test_purchase_can_add_carriage_without_a_receiving_outlay_and_recover_existing_carriage_once(): void
    {
        foreach ([['0', '20000'], ['5000', '20000'], ['20000', '5000']] as [$original, $entered]) {
            $receipt = $this->receive('100');
            $recovered = D::min($original, $entered);
            $recoveries = [];
            if (D::cmp($original, '0') > 0) {
                $outlay = $this->runCommand('expense.create', ['amount' => $original, 'reason' => 'တန်ဆာခ', 'account_id' => $this->cash->id, 'party_id' => $this->trader->id, 'recoverable' => true, 'source_document_id' => $receipt['document_id']]);
                $recoveries[] = ['document_id' => $outlay['document_id'], 'amount' => D::money($recovered)];
            }
            $balanceBefore = R::get('cash_accounts', $this->cash->id)->balance;
            $cashEntriesBefore = DB::table('cash_entries')->count();
            $key = (string) Str::uuid();
            $input = ['lines' => [['receipt_line_id' => $receipt['line_ids'][0], 'price' => '800', 'basis' => 'viss']], 'recoveries' => $recoveries, 'carriage_deduction' => D::money(D::sub($entered, $recovered))];
            $purchase = $this->runCommand('purchase.create', $input, $this->clerk, $key);
            $this->assertSame($purchase, $this->runCommand('purchase.create', $input, $this->clerk, $key));
            $this->equalDecimal(D::sub('80000', $entered), $purchase['net']);
            $this->equalDecimal($balanceBefore, R::get('cash_accounts', $this->cash->id)->balance);
            $this->assertSame($cashEntriesBefore, DB::table('cash_entries')->count());
            $this->equalDecimal($recovered, DB::table('recoveries')->where('target_document_id', $purchase['document_id'])->sum('amount'));
            $state = app(Projection::class)->forUser($this->clerk);
            $saved = collect($state['receipts'])->firstWhere('purchaseDocumentId', $purchase['document_id']);
            $this->equalDecimal($entered, D::add($saved['charges4']['carriage'], D::sum(array_column($saved['charges4']['dynamicRows'], 'amount'))));
        }
    }

    public function test_invalid_purchase_carriage_rolls_back_without_changing_stock_or_money(): void
    {
        $receipt = $this->receive('100');
        $documentsBefore = DB::table('documents')->count();
        foreach (['-1', '0.001', '80000.01'] as $amount) {
            try {
                $this->purchase($receipt['line_ids'][0], ['carriage_deduction' => $amount]);
                $this->fail('Invalid carriage must not post a purchase.');
            } catch (ValidationException $exception) {
                $this->assertNotEmpty($exception->errors());
            }
            $this->assertSame($documentsBefore, DB::table('documents')->count());
            $this->assertSame('supplier', $this->lot()->owner);
            $this->assertSame(0, DB::table('cash_entries')->count());
            $this->equalDecimal('2000000', R::get('cash_accounts', $this->cash->id)->balance);
        }
    }

    public function test_projection_query_count_stays_constant_as_vouchers_and_expenses_grow(): void
    {
        $addRecords = function (): void {
            $receipt = $this->receive('100');
            $this->purchase($receipt['line_ids'][0]);
            $this->sale('10');
            $this->runCommand('expense.create', ['amount' => '100', 'reason' => 'Transport', 'account_id' => $this->cash->id, 'party_id' => $this->trader->id, 'recoverable' => true, 'source_document_id' => $receipt['document_id']]);
        };
        $projection = fn () => app(Projection::class)->forUser($this->owner);

        $addRecords();
        $initialQueryCount = $this->queryCount($projection);
        for ($i = 0; $i < 3; $i++) {
            $addRecords();
        }

        $this->assertSame($initialQueryCount, $this->queryCount($projection), 'Workspace projection must not query cash and charge data once per document.');
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertCount(4, $state['receipts']);
        $this->assertCount(4, $state['sales']);
        $this->assertCount(4, $state['expenses']);
        $this->assertCount(4, $state['transactions']);
    }

    public function test_report_and_closing_queries_stay_constant_as_documents_grow(): void
    {
        $addRecords = function (): void {
            $receipt = $this->receive('100');
            $advance = $this->runCommand('advance.create', ['party_id' => $this->trader->id, 'amount' => '1000', 'account_id' => $this->cash->id]);
            $this->purchase($receipt['line_ids'][0], [
                'recoveries' => [['document_id' => $advance['document_id'], 'amount' => '400']],
                'payments' => [['account_id' => $this->cash->id, 'amount' => '200']],
            ]);
            $this->sale('10');
            $this->receive('100');
            $this->sale('10');
        };
        $reports = app(Reports::class);
        $profit = fn () => $reports->profit($this->owner, '2026-10-25', '2026-10-25');
        $statement = fn () => $reports->statement($this->owner, $this->trader->id, '2026-10-25', '2026-10-25');
        $day = DB::table('business_days')->first();
        $closing = fn () => app(ClosingSnapshot::class)->capture($day, [
            'expectedBefore' => '0', 'expectedAfter' => '0', 'actualBefore' => '0',
            'actualAfter' => '0', 'difference' => '0', 'note' => '',
        ]);
        $operations = ['profit' => $profit, 'statement' => $statement, 'closing' => $closing];
        $addRecords();
        $initialQueryCounts = array_map(fn ($operation) => $this->queryCount($operation), $operations);

        for ($i = 0; $i < 3; $i++) {
            $addRecords();
        }

        foreach ($operations as $name => $operation) {
            $this->assertSame($initialQueryCounts[$name], $this->queryCount($operation), "$name must not query once per document.");
        }
        $profitResult = $profit();
        $this->equalDecimal('40000', $profitResult['ownedRevenue']);
        $this->equalDecimal('40000', $profitResult['supplierGross']);
        $this->equalDecimal('32000', $profitResult['cogs']);
        $statementResult = $statement();
        $this->equalDecimal('357600', $statementResult['payable']);
        $this->equalDecimal('2400', $statementResult['advances']);
        $this->equalDecimal('2400', $closing()['debts']['advance']);
    }

    public function test_statement_excludes_payments_and_recoveries_after_the_report_cutoff(): void
    {
        $receipt = $this->receive('100');
        $advance = $this->runCommand('advance.create', ['party_id' => $this->trader->id, 'amount' => '1000', 'account_id' => $this->cash->id]);
        $purchase = $this->purchase($receipt['line_ids'][0], [
            'recoveries' => [['document_id' => $advance['document_id'], 'amount' => '400']],
            'payments' => [['account_id' => $this->cash->id, 'amount' => '200']],
        ]);
        DB::table('payments')->where('document_id', $purchase['document_id'])->update(['business_date' => '2026-10-26']);
        DB::table('recoveries')->where('source_document_id', $advance['document_id'])->update(['business_date' => '2026-10-26']);
        $reports = app(Reports::class);

        $before = $reports->statement($this->owner, $this->trader->id, '2026-10-25', '2026-10-25');
        $after = $reports->statement($this->owner, $this->trader->id, '2026-10-26', '2026-10-26');

        $this->equalDecimal('79600', $before['payable']);
        $this->equalDecimal('1000', $before['advances']);
        $this->equalDecimal('79400', $after['payable']);
        $this->equalDecimal('600', $after['advances']);
        $this->assertSame([], $after['events']);
    }

    public function test_historical_expense_does_not_increase_unrelated_home_balance(): void
    {
        $reason = R::insert('expense_reasons', ['name' => 'Electricity']);
        $this->runCommand('expense.create', ['reason_id' => $reason->id, 'amount' => '20000', 'account_id' => $this->cash->id], $this->clerk);
        $this->equalDecimal('1980000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('500000', R::get('cash_accounts', $this->home->id)->balance);
        $this->assertSame(0, DB::table('cash_entries')->where('account_id', $this->home->id)->count());
    }

    public function test_cash_movements_include_saved_expense_purpose_for_existing_entries(): void
    {
        $reason = R::insert('expense_reasons', ['name' => 'လျှပ်စစ်မီတာခ']);
        $expense = $this->runCommand('expense.create', ['reason_id' => $reason->id, 'amount' => '20000', 'account_id' => $this->cash->id], $this->clerk);
        $outlay = $this->runCommand('expense.create', ['reason' => 'ကားခ', 'recoverable' => true, 'party_id' => $this->trader->id, 'amount' => '5000', 'account_id' => $this->cash->id], $this->clerk);
        R::update('expense_reasons', $reason->id, ['name' => 'Renamed master']);

        foreach ([$this->owner, $this->clerk] as $actor) {
            $transactions = collect(app(Projection::class)->forUser($actor)['transactions'])->keyBy('ref');
            $expenseNumber = R::get('documents', $expense['document_id'])->number;
            $outlayNumber = R::get('documents', $outlay['document_id'])->number;
            $this->assertSame('ပွဲရုံခံ အသုံးစရိတ် · လျှပ်စစ်မီတာခ', $transactions[$expenseNumber]['title']);
            $this->assertSame('ယာယီ စိုက်ထုတ် · ကားခ', $transactions[$outlayNumber]['title']);
            $this->equalDecimal('-20000', $transactions[$expenseNumber]['amount']);
        }

        $this->assertSame('ပွဲရုံခံ အသုံးစရိတ်', DB::table('cash_entries')->where('document_id', $expense['document_id'])->value('title'));
        $this->equalDecimal('1975000', R::get('cash_accounts', $this->cash->id)->balance);
    }

    public function test_historical_today_purchase_and_current_stock_filters_use_different_dates(): void
    {
        $r = $this->runCommand('receipt.create', ['party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'date' => '2026-10-24', 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '1000']]]);
        $this->runCommand('purchase.create', ['lines' => [['receipt_line_id' => $r['line_ids'][0], 'price' => '20000', 'basis' => 'standard_bag']]]);
        R::update('products', $this->product->id, ['standard_viss' => '50']);
        $state = app(Projection::class)->forUser($this->owner);
        $this->equalDecimal('25', $state['receipts'][0]['standardBagViss47']);
        $type = R::insert('package_types', ['product_id' => $this->product->id, 'name' => '20 viss', 'size' => '20']);
        $this->runCommand('packaging.create', ['lot_id' => $this->lot('owned')->id, 'package_type_id' => $type->id, 'bags' => '10']);
        $reports = app(Reports::class);
        $today = $reports->overview($this->owner, '2026-10-25', '2026-10-25');
        $yesterday = $reports->overview($this->owner, '2026-10-24', '2026-10-24');
        $this->equalDecimal('800000', $today['purchaseGross']);
        $this->equalDecimal('0', $yesterday['purchaseGross']);
        $this->equalDecimal('1000', $today['currentTotal']);
        $this->equalDecimal('1000', $yesterday['currentTotal']);
        $this->equalDecimal('800', $today['currentLoose']);
        $this->equalDecimal('200', $today['currentPackaged']);
        $this->actingAs($this->owner)->get('/')->assertOk();
    }

    public function test_historical_profit_example_is_recalculated_from_new_mysql_records(): void
    {
        DB::table('business_days')->update(['business_date' => '2026-09-28']);
        R::insert('stock_lots', ['product_id' => $this->product->id, 'warehouse_id' => $this->warehouse->id, 'owner' => 'owned', 'batch' => 'Profit regression fixture', 'quantity' => '1', 'unit_cost' => '232038', 'entry_date' => '2026-09-28']);
        $this->sale('1', 'direct', ['lines' => [['lot_id' => $this->lot('owned')->id, 'quantity' => '1', 'price' => '1178333']]]);
        $this->runCommand('expense.create', ['amount' => '20000', 'account_id' => $this->cash->id, 'reason' => 'Operating expense']);
        $profit = app(Reports::class)->profit($this->owner, '2026-09-28', '2026-09-28');
        $this->equalDecimal('1178333', $profit['ownedRevenue']);
        $this->equalDecimal('232038', $profit['cogs']);
        $this->equalDecimal('20000', $profit['operatingExpenses']);
        $this->equalDecimal('926295', $profit['netProfit']);
    }

    public function test_historical_signed_adjustments_preserve_original_receipt_reference(): void
    {
        $r = $this->receive();
        $lot = $this->lot();
        $this->runCommand('stock.adjust', ['lot_id' => $lot->id, 'quantity' => '10', 'reason' => 'Count correction'], $this->clerk);
        $this->runCommand('stock.adjust', ['lot_id' => $lot->id, 'quantity' => '-5', 'reason' => 'Damage'], $this->clerk);
        $this->equalDecimal('1505', R::get('stock_lots', $lot->id)->quantity);
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertSame((string) $r['line_ids'][0], $state['adjustments'][0]['sourceReceiptId']);
        $this->assertSame('out', $state['adjustments'][1]['direction']);
        $this->equalDecimal('5', $state['adjustments'][1]['qty']);
        $this->assertSame('supplier', $state['adjustments'][1]['history2']['owner']);
        $this->equalDecimal('-5', $state['adjustments'][1]['history2']['qtyDelta']);
    }

    public function test_historical_advance_can_cover_purchase_without_new_payment(): void
    {
        $r = $this->receive('10');
        $advance = $this->runCommand('advance.create', ['party_id' => $this->trader->id, 'amount' => '10000', 'account_id' => $this->cash->id]);
        $p = $this->runCommand('purchase.create', ['lines' => [['receipt_line_id' => $r['line_ids'][0], 'price' => '1000']], 'recoveries' => [['document_id' => $advance['document_id'], 'amount' => '10000']]]);
        $this->equalDecimal('0', R::get('documents', $p['document_id'])->net);
        $this->assertSame(1, DB::table('cash_entries')->count());
        $this->assertSame(0, DB::table('payments')->count());
    }

    public function test_historical_customer_owned_goods_cannot_be_sold_twice(): void
    {
        $this->receive();
        $this->sale();
        $held = $this->lot('customer');
        $this->expectException(ValidationException::class);
        $this->runCommand('sale.create', ['party_id' => $this->buyer->id, 'lines' => [['lot_id' => $held->id, 'quantity' => '10', 'price' => '1000']]]);
    }

    public function test_multi_line_purchase_allocates_payment_history_without_duplicate_cash(): void
    {
        $corn = R::insert('products', ['name' => 'Corn', 'grades' => ['A'], 'standard_viss' => '25']);
        $r = $this->runCommand('receipt.create', ['party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '100'], ['product_id' => $corn->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '100']]]);
        $this->runCommand('purchase.create', ['lines' => [['receipt_line_id' => $r['line_ids'][0], 'price' => '10'], ['receipt_line_id' => $r['line_ids'][1], 'price' => '20']], 'payments' => [['account_id' => $this->cash->id, 'amount' => '1500']]]);
        $state = app(Projection::class)->forUser($this->owner);
        $history = array_merge(...array_column($state['receipts'], 'payments'));
        $this->equalDecimal('1500', D::sum(array_column($history, 'amount')));
        $this->equalDecimal('1000', $state['receipts'][0]['paid']);
        $this->equalDecimal('500', $state['receipts'][1]['paid']);
        $this->assertSame(1, DB::table('cash_entries')->count());
        $this->assertSame(2, DB::table('payment_allocations')->count());
    }

    public function test_standard_bag_pricing_does_not_truncate_units_before_multiplication(): void
    {
        R::update('products', $this->product->id, ['standard_viss' => '3']);
        $r = $this->receive('1');
        $p = $this->runCommand('purchase.create', ['lines' => [['receipt_line_id' => $r['line_ids'][0], 'price' => '100000001', 'basis' => 'standard_bag']]]);
        $this->equalDecimal('33333334', R::get('documents', $p['document_id'])->gross);
    }

    public function test_recorded_zero_weight_is_distinct_from_unknown_weight(): void
    {
        $r = $this->receive('0', '5');
        $lot = $this->lot();
        $this->assertNotNull($lot->quantity);
        $this->equalDecimal('0', $lot->quantity);
        $state = app(Projection::class)->forUser($this->owner);
        $this->assertTrue($state['receipts'][0]['weightKnown']);
    }

    public function test_daily_loan_interest_and_repayment_are_exact_and_not_compounded(): void
    {
        $loan = $this->runCommand('loan.create', ['party_id' => $this->trader->id, 'amount' => '10000', 'rate' => '3', 'date' => '2026-10-15', 'account_id' => $this->cash->id]);
        $this->runCommand('loan.repay', ['document_id' => $loan['document_id'], 'principal' => '4000', 'interest' => '100', 'account_id' => $this->cash->id]);
        $this->equalDecimal('1994100', R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('4000', DB::table('payments')->sum('principal'));
        $this->equalDecimal('100', DB::table('payments')->sum('interest'));
        $this->expectException(ValidationException::class);
        $this->runCommand('loan.repay', ['document_id' => $loan['document_id'], 'principal' => '0', 'interest' => '1', 'account_id' => $this->cash->id]);
    }

    public function test_loan_policy_crud_preserves_existing_loan_rates_and_interest(): void
    {
        $input = ['kind' => 'loan_policy', 'data' => ['name' => 'Monthly policy', 'monthlyRate' => '2.5']];
        $policy = $this->runCommand('master.save', $input)['id'];
        $loan = $this->runCommand('loan.create', ['policy_id' => $policy, 'rate' => '999', 'party_id' => $this->trader->id, 'amount' => '100000', 'account_id' => $this->cash->id, 'date' => '2026-10-15']);
        $doc = R::get('documents', $loan['document_id']);
        $this->equalDecimal('2.5', R::details($doc)['rate']);
        $this->assertSame($policy, R::details($doc)['policyId']);
        $input['id'] = $policy;
        $input['data']['monthlyRate'] = '5';
        $this->runCommand('master.save', $input);
        $this->runCommand('master.inactivate', ['kind' => 'loan_policy', 'id' => $policy]);
        $this->runCommand('loan.repay', ['document_id' => $doc->id, 'principal' => '0', 'interest' => '833.33', 'account_id' => $this->cash->id]);
        $this->equalDecimal('833.33', DB::table('payments')->where('document_id', $doc->id)->sum('interest'));
        $this->equalDecimal('2.5', R::details(R::get('documents', $doc->id))['rate']);
        $input['data']['active'] = true;
        $this->runCommand('master.save', $input);
        $newLoan = $this->runCommand('loan.create', ['policy_id' => $policy, 'party_id' => $this->trader->id, 'amount' => '10000', 'account_id' => $this->cash->id]);
        $this->equalDecimal('5', R::details(R::get('documents', $newLoan['document_id']))['rate']);
    }

    public function test_zero_percent_policy_has_no_accrued_interest_and_preserves_its_loan_snapshot(): void
    {
        $input = ['kind' => 'loan_policy', 'data' => ['name' => 'Interest free', 'monthlyRate' => '0']];
        $policy = $this->runCommand('master.save', $input)['id'];
        $this->equalDecimal('0', R::get('loan_interest_policies', $policy)->monthly_rate);
        $loan = $this->runCommand('loan.create', ['policy_id' => $policy, 'party_id' => $this->trader->id, 'amount' => '100000', 'account_id' => $this->cash->id, 'date' => '2026-10-15']);
        $input['id'] = $policy;
        $input['data']['monthlyRate'] = '5';
        $this->runCommand('master.save', $input);
        $this->equalDecimal('0', R::details(R::get('documents', $loan['document_id']))['rate']);
        try {
            $this->runCommand('loan.repay', ['document_id' => $loan['document_id'], 'principal' => '10000', 'interest' => '1', 'account_id' => $this->cash->id]);
            $this->fail('A zero-rate loan cannot collect accrued interest.');
        } catch (ValidationException $exception) {
            $this->assertSame(0, DB::table('payments')->where('document_id', $loan['document_id'])->count());
        }
        $this->runCommand('loan.repay', ['document_id' => $loan['document_id'], 'principal' => '10000', 'interest' => '0', 'account_id' => $this->cash->id]);
        $this->equalDecimal('0', DB::table('payments')->where('document_id', $loan['document_id'])->sum('interest'));
        $this->equalDecimal('10000', DB::table('payments')->where('document_id', $loan['document_id'])->sum('principal'));
        $input['data']['monthlyRate'] = '0';
        $this->runCommand('master.save', $input);
        $legacy = $this->runCommand('loan.create', ['rate' => '0', 'party_id' => $this->trader->id, 'amount' => '1000', 'account_id' => $this->cash->id]);
        $this->equalDecimal('0', R::details(R::get('documents', $legacy['document_id']))['rate']);
    }

    public function test_opening_loan_accepts_an_explicit_zero_monthly_rate(): void
    {
        $draft = ['startDate' => '2026-10-25', 'accounts' => ['cash' => ['amount' => '2000000', 'checked' => true], 'home' => ['amount' => '500000', 'checked' => true]], 'own' => ['checked' => true, 'rows' => []], 'groups' => ['supplier' => true, 'buyer' => true], 'parties' => [(string) $this->trader->id => ['checked' => true, 'answers' => ['loan' => 'yes', 'stock' => 'no'], 'rows' => [], 'values' => ['loan' => '10000', 'loanInterest' => '0', 'loanRate' => '0']]]];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $this->runCommand('opening.approve');
        $loan = DB::table('documents')->where('kind', 'opening_loan')->first();
        $this->assertNotNull($loan);
        $this->equalDecimal('0', R::details($loan)['rate']);
        $this->equalDecimal('0', R::details($loan)['openingInterest']);
    }

    public function test_loan_policy_permissions_validation_and_inactive_selection(): void
    {
        $key = (string) Str::uuid();
        $input = ['kind' => 'loan_policy', 'data' => ['name' => 'Owner policy', 'monthlyRate' => '2.75']];
        $policy = $this->runCommand('master.save', $input, $this->owner, $key)['id'];
        $this->actingAs($this->clerk)->postJson('/api/commands', ['action' => 'master.save', 'input' => $input], ['Idempotency-Key' => $key])->assertForbidden();
        $this->postJson('/api/commands', ['action' => 'master.inactivate', 'input' => ['kind' => 'loan_policy', 'id' => $policy]], ['Idempotency-Key' => (string) Str::uuid()])->assertForbidden();
        $this->actingAs($this->owner);
        foreach (['-1', '101', 'invalid', '', null] as $rate) {
            $this->postJson('/api/commands', ['action' => 'master.save', 'input' => ['kind' => 'loan_policy', 'data' => ['name' => 'Invalid', 'monthlyRate' => $rate]]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        }
        $this->runCommand('master.inactivate', ['kind' => 'loan_policy', 'id' => $policy]);
        foreach ([['policy_id' => $policy], ['rate' => '2.75']] as $selection) {
            $this->postJson('/api/commands', ['action' => 'loan.create', 'input' => $selection + ['party_id' => $this->trader->id, 'amount' => '100', 'account_id' => $this->cash->id]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        }
        $this->assertSame(0, DB::table('documents')->where('kind', 'loan')->count());
        $this->assertNotEmpty(app(Projection::class)->forUser($this->clerk)['loanInterestPolicies']);
    }

    public function test_repeated_opening_reopen_keeps_audit_and_does_not_duplicate_stock(): void
    {
        $draft = ['startDate' => '2026-10-25', 'accounts' => ['cash' => ['amount' => '2000000', 'checked' => true], 'home' => ['amount' => '500000', 'checked' => true]], 'own' => ['checked' => true, 'rows' => [['productId' => (string) $this->product->id, 'warehouse' => (string) $this->warehouse->id, 'grade' => 'A', 'batch' => 'Opening', 'qty' => '100', 'bags' => '', 'costInput' => '10']]], 'groups' => ['supplier' => true, 'buyer' => true], 'parties' => []];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        $this->runCommand('opening.approve');
        $this->runCommand('opening.reopen', ['reason' => 'Correcting draft']);
        $this->runCommand('opening.approve');
        $this->equalDecimal('100', DB::table('stock_lots')->sum('quantity'));
        $this->runCommand('opening.reopen', ['reason' => 'Review again']);
        $this->equalDecimal('0', DB::table('stock_lots')->sum('quantity'));
        $this->assertSame(2, DB::table('stock_events')->where('kind', 'opening_reversal')->count());
        app(Projection::class)->forUser($this->owner);
    }

    public function test_clerk_cannot_remove_owner_entered_opening_loan_by_omitting_party(): void
    {
        $draft = ['accounts' => [], 'parties' => [(string) $this->trader->id => ['values' => ['loan' => '10000', 'loanInterest' => '100', 'loanRate' => '3']]]];
        $this->runCommand('opening.draft', ['draft' => $draft]);
        try {
            $this->runCommand('opening.draft', ['draft' => ['accounts' => [], 'parties' => []]], $this->clerk);
            $this->fail('Clerk must not erase an owner-controlled opening loan.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('owner', $e->getMessage());
        }
        $saved = R::details(DB::table('documents')->where('kind', 'opening')->first());
        $this->equalDecimal('10000', $saved['parties'][$this->trader->id]['values']['loan']);
    }

    public function test_settlement_combines_fees_recoveries_offsets_and_initial_payment_once(): void
    {
        $this->receive();
        $this->sale();
        $settlement = DB::table('documents')->where('kind', 'settlement')->first();
        $advance = $this->runCommand('advance.create', ['party_id' => $this->trader->id, 'amount' => '10000', 'account_id' => $this->cash->id]);
        $outlay = $this->runCommand('expense.create', ['party_id' => $this->trader->id, 'amount' => '2000', 'account_id' => $this->cash->id, 'recoverable' => true, 'reason' => 'Carriage']);
        $loan = $this->runCommand('loan.create', ['party_id' => $this->trader->id, 'amount' => '20000', 'rate' => '3', 'account_id' => $this->cash->id]);
        $manual = R::insert('adjustment_rates', ['name' => 'Charge', 'kind' => 'purchase', 'item_type' => 'custom', 'calc_mode' => 'manual']);
        $this->runCommand('settlement.confirm', ['document_id' => $settlement->id, 'service_mode' => 'yes', 'service_rate' => '1', 'adjustments' => [['rate_id' => $manual->id, 'amount' => '1000', 'direction' => 'subtract']], 'recoveries' => [['document_id' => $advance['document_id'], 'amount' => '10000'], ['document_id' => $outlay['document_id'], 'amount' => '2000']], 'loan_offsets' => [['document_id' => $loan['document_id'], 'principal' => '5000', 'interest' => '0']], 'payments' => [['account_id' => $this->cash->id, 'amount' => '100000']]]);
        $this->equalDecimal('477000', R::get('documents', $settlement->id)->net);
        $this->equalDecimal('100000', R::get('documents', $settlement->id)->paid);
        $this->equalDecimal('1868000', R::get('cash_accounts', $this->cash->id)->balance);
        $this->equalDecimal('1500', DB::table('stock_lots')->sum('quantity'));
    }

    public function test_receiving_carriage_edit_reverses_cash_without_duplicate_outlay(): void
    {
        $r = $this->runCommand('receipt.create', ['party_id' => $this->trader->id, 'warehouse_id' => $this->warehouse->id, 'carriage_amount' => '1000', 'carriage_account_id' => $this->cash->id, 'lines' => [['product_id' => $this->product->id, 'grade' => 'A', 'bag_type' => 'weight', 'quantity' => '300']]]);
        $this->runCommand('receipt.edit', ['document_id' => $r['document_id'], 'carriage_amount' => '1500', 'carriage_account_id' => $this->cash->id]);
        $this->equalDecimal('1998500', R::get('cash_accounts', $this->cash->id)->balance);
        $this->assertSame(1, DB::table('documents')->where('kind', 'outlay')->count());
        $this->equalDecimal('1500', DB::table('documents')->where('kind', 'outlay')->value('net'));
    }
}
