<?php

namespace App\Domain;

use DOMDocument;
use DOMXPath;
use Illuminate\Validation\ValidationException;
use PharData;
use RecursiveIteratorIterator;
use Throwable;

/** User-supplied opening template: bounded XLSX XML access, without executing formulas or extracting files. */
final class OpeningWorkbook
{
    private const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

    public const HEADERS = [
        'ငွေလက်ကျန်' => ['ငွေသိမ်းရာ', 'ပမာဏ'],
        'ကုန်လက်ကျန်' => ['ပိုင်ဆိုင်မှု', 'ကုန်ပိုင်ရှင်', 'ကုန်ပစ္စည်း', 'အဆင့်', 'ဂိုဒေါင်', 'အသုတ်', 'ပိဿာ', 'အိတ်', 'ဈေးတွက်ပုံ', 'ဝယ်ရင်းနှုန်း', 'စံအိတ်ဝင်ပိဿာ', 'မူရင်းကုန်သည်', 'မှတ်ချက်'],
        'တစ်ဦးချင်းငွေကျန်' => ['လူအမျိုးအစား', 'အမည်နှင့်နေရပ်', 'ငွေကျန်အမျိုးအစား', 'ပမာဏ', 'အတိုးနှုန်း', 'အတိုးကျန်'],
    ];

    private function xml(string $source): DOMDocument
    {
        Records::require(strlen($source) <= 12000000 && ! preg_match('/<!DOCTYPE|<!ENTITY/i', $source), 'Excel XML ဖိုင် မမှန်ကန်ပါ။');
        $doc = new DOMDocument;
        $before = libxml_use_internal_errors(true);
        try {
            Records::require($doc->loadXML($source, LIBXML_NONET | LIBXML_COMPACT), 'Excel ဖိုင် ဖတ်မရပါ။');
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($before);
        }

        return $doc;
    }

    private function archive(string $path): PharData
    {
        try {
            $handle = fopen($path, 'rb');
            Records::require($handle !== false, 'Excel ဖိုင် ဖတ်မရပါ။');
            $signature = fread($handle, 4);
            fclose($handle);
            Records::require($signature === "PK\x03\x04", 'Excel .xlsx နမူနာ format ကို သုံးပါ။');
            $archive = new PharData($path);
            $size = 0;
            $count = 0;
            foreach (new RecursiveIteratorIterator($archive) as $entry) {
                $size += $entry->getSize();
                Records::require(++$count <= 300 && $entry->getSize() <= 12000000 && $size <= 30000000, 'Excel ဖိုင် အရွယ်အစား ကြီးလွန်းပါသည်။');
            }
            Records::require(isset($archive['xl/workbook.xml'], $archive['xl/_rels/workbook.xml.rels']), 'ပေးထားသော .xlsx နမူနာ format ကို သုံးပါ။');

            return $archive;
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable) {
            Records::require(false, 'Excel .xlsx ဖိုင် ဖတ်မရပါ။ နမူနာ format ကို သုံးပါ။');
        }
    }

    private function sheetPaths(PharData $archive): array
    {
        $rels = new DOMXPath($this->xml($archive['xl/_rels/workbook.xml.rels']->getContent()));
        $targets = [];
        foreach ($rels->query('//*[local-name()="Relationship"]') as $rel) {
            if ($rel->getAttribute('TargetMode') === 'External') {
                continue;
            }
            $target = $rel->getAttribute('Target');
            Records::require(! str_contains($target, '..') && ! str_contains($target, '\\'), 'Excel worksheet link မမှန်ကန်ပါ။');
            $targets[$rel->getAttribute('Id')] = str_starts_with($target, '/') ? ltrim($target, '/') : 'xl/'.$target;
        }
        $sheets = new DOMXPath($this->xml($archive['xl/workbook.xml']->getContent()));
        $paths = [];
        foreach ($sheets->query('//*[local-name()="sheet"]') as $sheet) {
            $name = $sheet->getAttribute('name');
            Records::require(! isset($paths[$name]), 'Excel Sheet အမည် ထပ်နေပါသည်။');
            $id = $sheet->getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
            $path = $targets[$id] ?? '';
            Records::require(str_starts_with($path, 'xl/worksheets/') && isset($archive[$path]), 'Excel Sheet ဖတ်မရပါ။');
            $paths[$name] = $path;
        }

        return $paths;
    }

    public function read(string $path): array
    {
        $archive = $this->archive($path);
        $paths = $this->sheetPaths($archive);
        $strings = [];
        if (isset($archive['xl/sharedStrings.xml'])) {
            $xp = new DOMXPath($this->xml($archive['xl/sharedStrings.xml']->getContent()));
            foreach ($xp->query('//*[local-name()="si"]') as $item) {
                $text = '';
                foreach ($xp->query('.//*[local-name()="t"]', $item) as $part) {
                    $text .= $part->textContent;
                }
                $strings[] = $text;
            }
        }
        $result = [];
        foreach (self::HEADERS as $name => $headers) {
            Records::require(isset($paths[$name]), $name.' Sheet မရှိပါ။ နမူနာဖိုင်ကို သုံးပါ။');
            $xp = new DOMXPath($this->xml($archive[$paths[$name]]->getContent()));
            $rows = $xp->query('//*[local-name()="sheetData"]/*[local-name()="row"]');
            Records::require($rows->length <= 5005, $name.' Sheet တွင် အတန်း ၅,၀၀၀ ထက် မပိုရပါ။');
            $result[$name] = [];
            $headerFound = false;
            foreach ($rows as $row) {
                $number = (int) $row->getAttribute('r');
                if ($number < 5) {
                    continue;
                }
                $cells = array_fill(0, count($headers), '');
                foreach ($xp->query('./*[local-name()="c"]', $row) as $cell) {
                    preg_match('/^([A-Z]+)\d+$/D', $cell->getAttribute('r'), $matches);
                    $column = 0;
                    foreach (str_split($matches[1] ?? '') as $letter) {
                        $column = $column * 26 + ord($letter) - 64;
                    }
                    Records::require($xp->query('./*[local-name()="f"]', $cell)->length === 0, $name.' အတန်း '.$number.' တွင် Formula မသုံးပါနှင့်။ တန်ဖိုးကိုသာ ဖြည့်ပါ။');
                    $type = $cell->getAttribute('t');
                    $raw = $xp->evaluate('string(./*[local-name()="v"])', $cell);
                    if ($type === 's') {
                        Records::require(ctype_digit($raw) && isset($strings[(int) $raw]), 'Excel စာသား မမှန်ကန်ပါ။');
                        $raw = $strings[(int) $raw];
                    } elseif ($type === 'inlineStr') {
                        $raw = '';
                        foreach ($xp->query('./*[local-name()="is"]//*[local-name()="t"]', $cell) as $part) {
                            $raw .= $part->textContent;
                        }
                    } else {
                        Records::require(in_array($type, ['', 'n', 'str'], true) || $raw === '', $name.' အတန်း '.$number.' တွင် မမှန်သော Excel cell type ရှိပါသည်။');
                    }
                    $raw = trim($raw);
                    Records::require(mb_strlen($raw) <= 500, $name.' အတန်း '.$number.' စာသား ရှည်လွန်းပါသည်။');
                    if ($column < 1 || $column > count($headers)) {
                        Records::require($raw === '', $name.' အတန်း '.$number.' တွင် format အပြင်ဘက် data ရှိပါသည်။');
                    } else {
                        $cells[$column - 1] = $raw;
                    }
                }
                if ($number === 5) {
                    Records::require($cells === $headers, $name.' Sheet ခေါင်းစဉ်များ မပြောင်းပါနှင့်။ နမူနာဖိုင်ကို သုံးပါ။');
                    $headerFound = true;
                } elseif (array_filter($cells, fn ($value) => $value !== '') !== []) {
                    Records::require(! isset($result[$name][$number]), 'Excel အတန်းနံပါတ် ထပ်နေပါသည်။');
                    $result[$name][$number] = $cells;
                }
            }
            Records::require($headerFound, $name.' Sheet ခေါင်းစဉ် မရှိပါ။');
        }

        return $result;
    }

    /** Keep the supplied workbook's formatting/validation, replacing only its hidden dropdown lists. */
    public function template(array $lists): string
    {
        $base = tempnam(sys_get_temp_dir(), 'pwe-opening-');
        Records::require($base !== false, 'နမူနာဖိုင် ပြုလုပ်မရပါ။');
        $path = $base.'.xlsx';
        unlink($base);
        try {
            $archive = $this->archive(resource_path('templates/opening-import.xlsx'));
            $paths = $this->sheetPaths($archive);
            $doc = new DOMDocument('1.0', 'UTF-8');
            $root = $doc->appendChild($doc->createElementNS(self::NS, 'worksheet'));
            $data = $root->appendChild($doc->createElementNS(self::NS, 'sheetData'));
            for ($i = 0; $i < min(2000, max(array_map('count', $lists))); $i++) {
                $row = $data->appendChild($doc->createElementNS(self::NS, 'row'));
                $row->setAttribute('r', (string) ($i + 2));
                foreach ($lists as $column => $values) {
                    if (! isset($values[$i])) {
                        continue;
                    }
                    $cell = $row->appendChild($doc->createElementNS(self::NS, 'c'));
                    $cell->setAttribute('r', $column.($i + 2));
                    $cell->setAttribute('t', 'inlineStr');
                    $inline = $cell->appendChild($doc->createElementNS(self::NS, 'is'));
                    $text = $inline->appendChild($doc->createElementNS(self::NS, 't'));
                    $text->appendChild($doc->createTextNode((string) $values[$i]));
                }
            }
            $this->writeTemplateArchive($archive, $paths['_Lists'], $doc->saveXML(), $path);
            unset($archive);
            // Download headers must use the rewritten ZIP size, not cached source-file metadata.
            clearstatcache(true, $path);

            return $path;
        } catch (Throwable $e) {
            if (is_file($path)) {
                unlink($path);
            }
            throw $e;
        }
    }

    /** Write the trusted template as ZIP 2.0, without PharData's version-zero headers. */
    private function writeTemplateArchive(PharData $archive, string $listPath, string $listXml, string $path): void
    {
        $body = '';
        $directory = '';
        $count = 0;
        $prefixLength = strlen('phar://'.$archive->getPath().'/');
        foreach (new RecursiveIteratorIterator($archive) as $entry) {
            $name = substr($entry->getPathname(), $prefixLength);
            $content = $name === $listPath ? $listXml : $entry->getContent();
            $compressed = gzdeflate($content);
            Records::require($compressed !== false, 'Cannot compress the Excel template.');
            $crc = crc32($content);
            $compressedSize = strlen($compressed);
            $size = strlen($content);
            $nameLength = strlen($name);
            $offset = strlen($body);
            // ZIP 2.0, UTF-8 names, Deflate, and the valid DOS epoch date (1980-01-01).
            $body .= pack('VvvvvvVVVvv', 0x04034B50, 20, 0x0800, 8, 0, 33, $crc, $compressedSize, $size, $nameLength, 0).$name.$compressed;
            $directory .= pack('VvvvvvvVVVvvvvvVV', 0x02014B50, 20, 20, 0x0800, 8, 0, 33, $crc, $compressedSize, $size, $nameLength, 0, 0, 0, 0, 0, $offset).$name;
            $count++;
        }
        $bytes = $body.$directory.pack('VvvvvVVv', 0x06054B50, 0, 0, $count, $count, strlen($directory), strlen($body), 0);
        Records::require(file_put_contents($path, $bytes) === strlen($bytes), 'Cannot save the Excel template.');
    }
}
