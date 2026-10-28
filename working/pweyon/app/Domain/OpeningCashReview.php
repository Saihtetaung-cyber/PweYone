<?php

namespace App\Domain;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/** Opening Cash Flow Update 2: review/link/recount never posts cash or edits the original count. */
final class OpeningCashReview
{
    private ?Collection $ledger = null;

    private ?array $claims = null;

    /** Load eligible cash evidence once per projection/command, avoiding queries per row. */
    private function ledger(): Collection
    {
        return $this->ledger ??= DB::table('cash_entries as e')
            ->join('cash_accounts as a', 'a.id', '=', 'e.account_id')
            ->join('documents as d', 'd.id', '=', 'e.document_id')
            ->leftJoin('cash_entries as reversal', 'reversal.reverses_id', '=', 'e.id')
            ->where('a.code', 'cash')->whereNull('e.reverses_id')->whereNull('reversal.id')
            ->whereNotIn('d.status', ['reversed', 'voided', 'cancelled'])
            ->select('e.*', 'd.number', 'd.source_document_id')->orderByDesc('e.id')->get()->keyBy('id');
    }

    public function metadata(object $day): array
    {
        return $day->opening_review ? json_decode($day->opening_review, true, 512, JSON_THROW_ON_ERROR) : [];
    }

    public function describe(object $day): array
    {
        $meta = $this->metadata($day);
        $difference = $day->opening_actual === null ? '0' : Decimal::sub($day->opening_actual, $day->opening_expected);
        $resolution = $meta['resolution'] ?? null;
        $status = ! $day->opening_checked ? 'unchecked' : (Decimal::cmp($difference, '0') === 0 ? 'matched' : 'pending');
        if ($status === 'pending' && isset($meta['reviewedAt'])) {
            $status = 'reviewed';
            if ($resolution) {
                $status = $resolution['method'] === 'recount' ? 'recounted' : ($this->linksValid($resolution['entries']) ? 'linked' : 'invalid');
            }
        }

        return [
            'id' => (string) $day->id, 'date' => $day->business_date,
            'checked' => (bool) $day->opening_checked, 'expected' => $day->opening_expected,
            'actual' => $day->opening_actual, 'difference' => Decimal::money($difference),
            'note' => $day->opening_note ?? '', 'status' => $status,
            'submittedAt' => $meta['submittedAt'] ?? null, 'submittedBy' => $meta['submittedBy'] ?? null,
            'submittedRole' => $meta['submittedRole'] ?? null,
            'reviewedAt' => $meta['reviewedAt'] ?? null, 'reviewedBy' => $meta['reviewedBy'] ?? null,
            'reviewNote' => $meta['reviewNote'] ?? '', 'resolution' => $resolution,
            'history' => $meta['history'] ?? [],
            'legacy' => ! array_key_exists('cashEntryWatermark', $meta),
            'fingerprint' => hash('sha256', json_encode([$day->id, $day->opening_checked, $day->opening_expected, $day->opening_actual, $day->opening_note, $meta, $status], JSON_THROW_ON_ERROR)),
        ];
    }

    private function entrySnapshot(object $entry): array
    {
        return ['id' => (string) $entry->id, 'accountId' => (string) $entry->account_id, 'documentId' => (string) $entry->document_id, 'date' => $entry->business_date, 'amount' => $entry->amount, 'title' => $entry->title];
    }

    private function linksValid(array $snapshots): bool
    {
        if ($snapshots === []) {
            return false;
        }
        foreach ($snapshots as $snapshot) {
            $entry = $this->ledger()->get($snapshot['id']);
            if (! $entry || $this->entrySnapshot($entry) !== array_intersect_key($snapshot, $this->entrySnapshot($entry))) {
                return false;
            }
        }

        return true;
    }

    public function candidates(object $day, bool $includeLegacySameDay = false): array
    {
        $meta = $this->metadata($day);
        $difference = Decimal::sub($day->opening_actual ?? '0', $day->opening_expected);
        $limit = ltrim($difference, '-');
        $latest = DB::table('business_days')->max('business_date');
        $used = [];
        if ($this->claims === null) {
            $this->claims = [];
            foreach (DB::table('business_days')->whereNotNull('opening_review')->get() as $other) {
                $this->claims[$other->id] = array_column($this->metadata($other)['resolution']['entries'] ?? [], 'id');
            }
        }
        foreach ($this->claims as $dayId => $ids) {
            if ((string) $dayId !== (string) $day->id) {
                $used = array_merge($used, $ids);
            }
        }
        $out = [];
        foreach ($this->ledger() as $entry) {
            if ($entry->business_date < $day->business_date || $entry->business_date > $latest
                || (array_key_exists('cashEntryWatermark', $meta) ? $entry->id <= $meta['cashEntryWatermark'] : (! $includeLegacySameDay && $entry->business_date === $day->business_date))
                || in_array((string) $entry->id, $used, true)
                || Decimal::cmp($entry->amount, '0') !== Decimal::cmp($difference, '0')
                || Decimal::cmp(ltrim($entry->amount, '-'), $limit) > 0) {
                continue;
            }
            $out[] = $this->entrySnapshot($entry) + ['number' => $entry->number, 'reference' => $entry->source_document_id];
        }

        return $out;
    }

    public function decide(User $actor, array $in, bool $resolve): array
    {
        abort_unless($actor->role === 'owner', 403);
        $day = Records::get('business_days', $in['id'] ?? null);
        $view = $this->describe($day);
        Records::require(is_string($in['fingerprint'] ?? null) && hash_equals($view['fingerprint'], $in['fingerprint']), 'စစ်ချက် ပြောင်းလဲသွားပါသည်။ ဖောင်ကို ပြန်ဖွင့်ပြီး ပြန်စစ်ပါ။');
        Records::require(($in['confirmed'] ?? false) === true, 'စစ်ဆေးပြီးကြောင်း အမှန်ခြစ်ပါ။');
        $meta = $this->metadata($day);
        $note = $in['note'] ?? '';
        Records::require(is_string($note) && mb_strlen($note) <= 2000 && ! preg_match('/[<>\x00-\x08]/u', $note), 'မှတ်ချက်ကို မှန်ကန်စွာ ဖြည့်ပါ။');
        if (! $resolve) {
            Records::require($view['status'] === 'pending', 'ဤစစ်ချက်ကို စစ်ဆေးပြီးဖြစ်ပါသည်။');
            $meta['reviewedAt'] = now()->toIso8601String();
            $meta['reviewedBy'] = ['id' => (string) $actor->id, 'name' => $actor->name];
            $meta['reviewNote'] = trim($note);
        } else {
            Records::require(in_array($view['status'], ['reviewed', 'invalid'], true), 'ပိုင်ရှင်မှ အရင်စစ်ဆေးပါ။');
            Records::require(trim($note) !== '', 'ဖြေရှင်းသည့်အကြောင်းကို ဖြည့်ပါ။');
            $resolution = ['method' => $in['method'] ?? '', 'note' => trim($note), 'resolvedAt' => now()->toIso8601String(), 'resolvedBy' => ['id' => (string) $actor->id, 'name' => $actor->name]];
            if ($resolution['method'] === 'recount') {
                $actual = Decimal::value($in['actual'] ?? '', 2);
                Records::require(Decimal::cmp($actual, $day->opening_expected) === 0, 'ပြန်စစ်အဖွင့်ငွေသည် မူလစာရင်းအရ အဖွင့်ငွေနှင့် ကိုက်ညီရပါမည်။');
                $resolution['actual'] = $actual;
            } else {
                Records::require($resolution['method'] === 'link', 'ဖြေရှင်းပုံကို ရွေးပါ။');
                $ids = $in['entry_ids'] ?? [];
                Records::require(is_array($ids) && count($ids) > 0 && count($ids) <= 100 && count(array_unique($ids, SORT_REGULAR)) === count($ids), 'ချိတ်မည့် ငွေမှတ်တမ်းများကို ရွေးပါ။');
                $candidates = collect($this->candidates($day, ($in['include_legacy_same_day'] ?? false) === true))->keyBy('id');
                $entries = [];
                foreach ($ids as $id) {
                    Records::require((is_string($id) || is_int($id)) && $candidates->has($id), 'ရွေးထားသော ငွေမှတ်တမ်း ချိတ်ရန် မမှန်ကန်တော့ပါ။ ပြန်စစ်ပါ။');
                    $entries[] = $candidates[$id];
                }
                Records::require(Decimal::cmp(Decimal::sum(array_column($entries, 'amount')), $view['difference']) === 0, 'ရွေးထားသော စာရင်းစုစုပေါင်းသည် မူလကွာဟချက်နှင့် ကိုက်ညီရပါမည်။');
                $resolution['entries'] = $entries;
                $resolution['includeLegacySameDay'] = ($in['include_legacy_same_day'] ?? false) === true && $view['legacy'];
            }
            if (isset($meta['resolution'])) {
                $meta['history'][] = $meta['resolution'];
            }
            $meta['resolution'] = $resolution;
        }
        Records::update('business_days', $day->id, ['opening_review' => $meta]);

        return ['id' => $day->id, 'status' => $this->describe(Records::get('business_days', $day->id))['status']];
    }
}
