<?php

return [
    'enabled' => env('ACCOUNT_RECOVERY_ENABLED', ! in_array(env('APP_ENV', 'production'), ['testing', 'browser'], true)),
    'directory' => storage_path('app/private/account-recovery'),
];
