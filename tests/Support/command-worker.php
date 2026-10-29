<?php

use App\Domain\BusinessService;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->loadEnvironmentFrom('.env.testing');
$app->make(Kernel::class)->bootstrap();
if (DB::connection()->getDatabaseName() !== 'pweyon_test') {
    exit(98);
}
$in = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
while (microtime(true) < $in['start']) {
    usleep(1000);
}
try {
    $result = $app->make(BusinessService::class)->execute(User::findOrFail($in['actor']), $in['action'], $in['input'], $in['key']);
    echo json_encode(['ok' => true, 'result' => $result], JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'class' => get_class($e), 'message' => $e->getMessage()], JSON_THROW_ON_ERROR);
}
