# Pwe Yon — လက်ရှိအသုံးပြုနေသော application

ဤ folder သည် တကယ်အလုပ်လုပ်နေသော Laravel application ဖြစ်သည်။ `php artisan serve` နှင့် Composer command များကို ဤနေရာမှ လုပ်ဆောင်ပါ။ Database သည် XAMPP MariaDB / port **3306** / `pweyon` ဖြစ်သည်။

| Folder / ဖိုင် | အသုံးပြုပုံ |
|---|---|
| `app/` | Login၊ လုပ်ပိုင်ခွင့်၊ လုပ်ငန်းစည်းမျဉ်း၊ database operations နှင့် reports |
| `routes/`, `bootstrap/`, `config/` | Application စတင်ခြင်း၊ URL လမ်းကြောင်းနှင့် configuration |
| `resources/views/auth/login.blade.php` | လက်ရှိ login မျက်နှာပြင် |
| `resources/views/workspace.blade.php` | လက်ရှိ Pwe Yon လုပ်ငန်းမျက်နှာပြင် |
| `resources/data/interface-defaults.json` | Server read model အသုံးပြုသော interface ဖွဲ့စည်းပုံ |
| `public/js/server-*.js` | မျက်နှာပြင်နှင့် Laravel API ချိတ်ဆက်မှု |
| `public/js/source/`, `public/css/source/` | လက်ရှိမျက်နှာပြင်က တကယ် load လုပ်သည့် script/style များ |
| `database/migrations/` | Application database ကို တည်ဆောက်သည့် migrations |
| `tests/`, `database/factories/`, `phpunit.xml` | Database သီးခြားဖြင့် စမ်းသပ်ရာတွင် အသုံးပြုသည့် ဖိုင်များ |
| `vendor/`, `composer.json`, `composer.lock` | Laravel/PHP dependencies နှင့် version သတ်မှတ်ချက်များ |
| `storage/`, `bootstrap/cache/` | Application ထုတ်ပေးသော session၊ log၊ cache နှင့် compiled view များ |
| `.env` | လက်ရှိ application configuration; လျှို့ဝှက်တန်ဖိုးများ ပါဝင်သည် |
| `.env.testing`, `.env.browser` | `pweyon_test` သီးခြား database အတွက် configuration |
| `AGENTS.md`, `CLAUDE.md`, `boost.json` | Development agent အသုံးပြုသည့် project လမ်းညွှန်များ |

`public/*/source` ထဲကဖိုင်များသည် archive မဟုတ်ပါ။ လက်ရှိ Blade view က ၎င်းတို့ကို တိုက်ရိုက်ချိတ်ဆက်ထားသည်။ မူရင်း reference HTML/PDF များမှာ workspace root ၏ `reference/` အောက်တွင် သီးခြားရှိသည်။

မသုံးထားသော welcome page၊ Vite/Tailwind scaffold နှင့် ၎င်းတို့၏ package/config ဖိုင်များကို အသုံးပြုသူညွှန်ကြားချက်အရ ဖျက်ပြီးဖြစ်သည်။ လက်ရှိ interface အတွက် frontend build မလိုအပ်ပါ။

အသေးစိတ် [setup/run commands](../../README.md) နှင့် [folder ခွဲထားပုံ](../../docs/FOLDER_MAP_MM.md) ကို ကြည့်ပါ။
