<?php

// Browser-only workbook data. No application bootstrap, database connection or real records.
use App\Domain\OpeningWorkbook;

require dirname(__DIR__, 2).'/working/pweyon/vendor/autoload.php';
$root = dirname(__DIR__, 2);
$fixture = json_decode(file_get_contents($root.'/development/runtime/browser-fixture.json'), true, 512, JSON_THROW_ON_ERROR);
if ($fixture['owner']['email'] !== 'browser-owner@example.test') {
    throw new RuntimeException('Expected disposable browser fixture.');
}
$stock = [
    ['ပွဲရုံပိုင်', '', $fixture['product'], 'A', 'Browser Main', 'EXCEL-OWN', '100.25', '4', 'တစ်စံအိတ်ဈေး', '25000', '20', 'Browser Trader (Town)', 'Excel opening note'],
    ['ကုန်သည်ပိုင်', 'Browser Trader (Town)', $fixture['product'], 'A', 'Browser Main', 'EXCEL-SUPPLIER', '50', '2'],
    ['ဝယ်သူပိုင်', 'Browser Buyer', $fixture['product'], 'A', 'Browser Main', 'EXCEL-BUYER', '12.5'],
];
$sheets = ['ငွေလက်ကျန်' => [['Cash', '1234567']], 'ကုန်လက်ကျန်' => $stock, 'တစ်ဦးချင်းငွေကျန်' => [['ကုန်သည်', 'Browser Trader (Town)', 'ကြိုသုံးငွေ', '2000'], ['ဝယ်သူ', 'Browser Buyer', 'ဝယ်သူထံမှ ရရန်', '3000']]];
foreach (['valid', 'invalid'] as $variant) {
    $path = $root.'/development/runtime/opening-import-'.$variant.'.xlsx';
    if (is_file($path)) {
        unlink($path);
    }
    copy($root.'/working/pweyon/resources/templates/opening-import.xlsx', $path);
    $archive = new PharData($path);
    $index = 2;
    foreach (OpeningWorkbook::HEADERS as $name => $headers) {
        $rows = $sheets[$name];
        if ($variant === 'invalid' && $name === 'ကုန်လက်ကျန်') {
            $rows[0][2] = 'Missing product';
        }
        $doc = new DOMDocument('1.0', 'UTF-8');
        $rootElement = $doc->appendChild($doc->createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'worksheet'));
        $data = $rootElement->appendChild($doc->createElement('sheetData'));
        foreach (array_merge([$headers], $rows) as $i => $values) {
            $row = $data->appendChild($doc->createElement('row'));
            $row->setAttribute('r', (string) ($i + 5));
            foreach ($values as $j => $value) {
                $cell = $row->appendChild($doc->createElement('c'));
                $cell->setAttribute('r', chr(65 + $j).($i + 5));
                $cell->setAttribute('t', 'inlineStr');
                $text = $cell->appendChild($doc->createElement('is'))->appendChild($doc->createElement('t'));
                $text->appendChild($doc->createTextNode($value));
            }
        }
        $archive['xl/worksheets/sheet'.$index++.'.xml'] = $doc->saveXML();
    }
    unset($archive);
}
echo "Disposable opening workbook fixtures ready.\n";
