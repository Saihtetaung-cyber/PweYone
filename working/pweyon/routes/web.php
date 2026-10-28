<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OpeningImportController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'form'])->name('login')->block(60, 10);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1')->block(60, 10);
});
Route::middleware('auth')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index'])->block(60, 10);
    Route::get('/api/state', [WorkspaceController::class, 'state'])->block(60, 10);
    Route::get('/api/reports/{kind}', ReportController::class)->block(60, 10);
    Route::post('/api/commands', [WorkspaceController::class, 'command'])->block(60, 10);
    Route::get('/opening/import/template', [OpeningImportController::class, 'template'])->name('opening.import.template')->block(60, 10);
    Route::post('/api/opening/import/preview', [OpeningImportController::class, 'preview'])->middleware('throttle:12,1')->name('opening.import.preview')->block(60, 10);
    Route::post('/api/workspace/view', [AuthController::class, 'workspaceView'])->block(60, 10);
    Route::get('/api/account', [AuthController::class, 'account'])->block(60, 10);
    Route::post('/api/account', [AuthController::class, 'updateAccount'])->middleware('throttle:6,1')->block(60, 10);
    Route::post('/api/account/owner-password', [AuthController::class, 'updateOwnerPassword'])->middleware('throttle:6,1')->block(60, 10);
    Route::post('/logout', [AuthController::class, 'logout'])->block(60, 10);
});
