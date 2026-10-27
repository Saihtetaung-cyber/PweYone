$ErrorActionPreference = 'Stop'
$workspacePath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$blocksPath = Join-Path $workspacePath 'development/runtime/technology-overview-mm.json'
$outputPath = Join-Path $workspacePath 'docs/PweYon_Technology_Overview_MM.docx'
$blocks = Get-Content -LiteralPath $blocksPath -Encoding UTF8 -Raw | ConvertFrom-Json
function Escape-Xml([string]$value) { return [System.Security.SecurityElement]::Escape($value) }
function New-Paragraph([string]$content, [string]$style = 'Normal') {
    return '<w:p><w:pPr><w:pStyle w:val="' + $style + '"/></w:pPr><w:r><w:t xml:space="preserve">' + (Escape-Xml $content) + '</w:t></w:r></w:p>'
}
$body = [System.Text.StringBuilder]::new()
foreach ($block in $blocks) {
    $kind = $block[0]
    if ($kind -eq 'table') {
        [void]$body.Append('<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CCD5DE"/><w:left w:val="single" w:sz="4" w:color="CCD5DE"/><w:bottom w:val="single" w:sz="4" w:color="CCD5DE"/><w:right w:val="single" w:sz="4" w:color="CCD5DE"/><w:insideH w:val="single" w:sz="4" w:color="CCD5DE"/><w:insideV w:val="single" w:sz="4" w:color="CCD5DE"/></w:tblBorders><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="2450"/><w:gridCol w:w="7450"/></w:tblGrid>')
        $rowIndex = 0
        foreach ($row in $block[1]) {
            [void]$body.Append('<w:tr><w:trPr><w:cantSplit/>' + $(if ($rowIndex -eq 0) { '<w:tblHeader/>' }) + '</w:trPr>')
            for ($columnIndex = 0; $columnIndex -lt 2; $columnIndex++) {
                $width = if ($columnIndex -eq 0) { '2450' } else { '7450' }
                $shading = if ($rowIndex -eq 0) { '<w:shd w:fill="E8F0F8"/>' } else { '' }
                [void]$body.Append('<w:tc><w:tcPr><w:tcW w:w="' + $width + '" w:type="dxa"/>' + $shading + '</w:tcPr>' + (New-Paragraph ([string]$row[$columnIndex]) 'TableText') + '</w:tc>')
            }
            [void]$body.Append('</w:tr>')
            $rowIndex++
        }
        [void]$body.Append('</w:tbl>')
        [void]$body.Append((New-Paragraph ''))
    } else {
        $style = switch ($kind) { 'title' { 'Title' }; 'subtitle' { 'Subtitle' }; 'h' { 'Heading1' }; 'flow' { 'Flow' }; default { 'Normal' } }
        $text = [string]$block[1]
        if ($kind -eq 'b') { $text = [char]0x2022 + ' ' + $text }
        [void]$body.Append((New-Paragraph $text $style))
    }
}
$parts = @{}
$parts['[Content_Types].xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
$parts['_rels/.rels'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
$parts['word/_rels/document.xml.rels'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
$parts['word/styles.xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Myanmar Text" w:hAnsi="Myanmar Text" w:cs="Myanmar Text" w:eastAsia="Myanmar Text"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:eastAsia="my-MM"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="340" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="20558B"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:color w:val="596A7B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="130"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="20558B"/><w:sz w:val="27"/><w:szCs w:val="27"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60" w:line="320" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Flow"><w:name w:val="Flow"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="20558B"/></w:rPr></w:style></w:styles>'
$parts['word/document.xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + $body.ToString() + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500"/></w:sectPr></w:body></w:document>'
Add-Type -AssemblyName System.IO.Compression
$fileStream = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::Create)
$zip = [System.IO.Compression.ZipArchive]::new($fileStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($name in $parts.Keys) {
        $null = [xml]$parts[$name]
        $entry = $zip.CreateEntry($name)
        $writer = [System.IO.StreamWriter]::new($entry.Open(), [System.Text.UTF8Encoding]::new($false))
        try { $writer.Write($parts[$name]) } finally { $writer.Dispose() }
    }
} finally { $zip.Dispose(); $fileStream.Dispose() }
Write-Output "Word document created: $outputPath"
