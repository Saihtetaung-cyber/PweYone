<?php

namespace App\Http\Controllers;

use App\Domain\OpeningImport;
use App\Domain\OpeningWorkbook;
use App\Domain\Records;
use App\Http\WorkspaceAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OpeningImportController extends Controller
{
    public function template(Request $request, WorkspaceAccess $access, OpeningImport $import, OpeningWorkbook $workbook): BinaryFileResponse
    {
        $path = $workbook->template($import->lists($access->actor($request)));

        return response()->download($path, 'PweYon_Opening_Import_Template.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Cache-Control' => 'private, no-store'])->deleteFileAfterSend(true);
    }

    public function preview(Request $request, WorkspaceAccess $access, OpeningImport $import): JsonResponse
    {
        $actor = $access->actor($request);
        if ($request->hasHeader('X-Pwe-File-Name')) {
            // Stream raw XLSX to a private bounded file; avoid host-specific multipart upload temp settings.
            $filename = rawurldecode((string) $request->header('X-Pwe-File-Name'));
            validator(['filename' => $filename], ['filename' => ['required', 'string', 'max:180', 'regex:/\.xlsx$/i']])->validate();
            $body = stream_get_contents($request->getContent(true), 2097153);
            Records::require($body !== false && strlen($body) > 0 && strlen($body) <= 2097152, 'Excel ဖိုင်သည် 2 MB အောက် ဖြစ်ရပါမည်။');
            $path = tempnam(sys_get_temp_dir(), 'pwe-opening-upload-');
            Records::require($path !== false, 'Excel ဖိုင် ခေတ္တသိမ်းမရပါ။');
            try {
                Records::require(file_put_contents($path, $body) === strlen($body), 'Excel ဖိုင် ခေတ္တသိမ်းမရပါ။');
                $result = $import->preview($actor, $path, $filename);
            } finally {
                unlink($path);
            }
        } else {
            $request->validate(['file' => ['required', 'file', 'max:2048', 'extensions:xlsx']]);
            $file = $request->file('file');
            $result = $import->preview($actor, $file->getRealPath(), $file->getClientOriginalName());
        }

        return response()->json($result)->header('Cache-Control', 'no-store');
    }
}
