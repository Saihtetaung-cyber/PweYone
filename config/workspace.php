<?php

return [
    'auto_initialize' => env('WORKSPACE_AUTO_INITIALIZE', ! in_array(env('APP_ENV', 'production'), ['testing', 'browser'], true)),
];
