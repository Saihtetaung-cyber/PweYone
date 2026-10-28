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

စတင်လက်ကျန် Excel Import ကို **သတ်မှတ်ချက် → စတင်လက်ကျန် ထည့်မယ်** တွင် အသုံးပြုနိုင်သည်။ **Excel နမူနာ Download** သည် ပေးထားသောနမူနာပုံစံအတိုင်း လက်ရှိကြည့်ခွင့်ရှိသော ငွေသိမ်းရာ၊ ကုန်၊ ဂိုဒေါင်နှင့် လူအမည် Dropdown များပါသည့် `.xlsx` ဖိုင်ကို ထုတ်ပေးသည်။ Sheet သုံးခု၏ ခေါင်းစဉ်မပြောင်းဘဲ အကြောင်း ၆ မှစဖြည့်ပါ။ မသုံးသည့် Sheet ကို အလွတ်ထားနိုင်သည်။ ဖိုင်သည် 2 MB၊ စုစုပေါင်း အတန်း ၃,၀၀၀ အတွင်း ဖြစ်ရမည်။ Formula အစား တန်ဖိုးသာ ဖြည့်ပါ။ အမည်အသစ်များကို သတ်မှတ်ချက်တွင် အရင်ထည့်ပါ။

**Excel Import လုပ်မယ် → ဖိုင်ကို အရင်စစ်မယ် → အနှစ်ချုပ်ကို စစ်ပြီး အမှန်ခြစ် → မူကြမ်းထဲ Import လုပ်မယ်** ဟု ဆောင်ရွက်ပါ။ Import က ငွေသိမ်းရာနှင့် တစ်ဦးချင်းငွေကျန်တန်ဖိုးများကို အစားထိုးပြီး၊ ကုန်လိုင်းအသစ်ကို ထပ်ပေါင်းသည်။ ပိုင်ရှင်/ကုန်/အဆင့်/ဂိုဒေါင်/အသုတ်တူ ကုန်လိုင်းနှင့် ဖိုင်တူထပ်တင်မှုကို တားထားသည်။ Import အဆင့်တွင် အမှန်တကယ်ငွေ/ကုန်စာရင်း မပြောင်းပါ။ ပုံမှန် ပိုင်ရှင်စစ်ဆေးအတည်ပြုမှု ဆက်လုပ်ရသည်။ အတည်ပြုပြီးသော အဖွင့်စာရင်းကို တိုက်ရိုက် Import ထပ်မလုပ်နိုင်ပါ။ စာရေးမသည် ကြည့်ခွင့်ရှိသည့် ငွေသိမ်းရာများကိုသာ Import လုပ်နိုင်ပြီး ကြိုထုတ်ငွေကို ပိုင်ရှင်ကသာ ထည့်နိုင်သည်။

အသုံးပြုသော နမူနာမှာ [bundled opening-import.xlsx](resources/templates/opening-import.xlsx) ဖြစ်ပြီး အခြား laptop တွင်လည်း ဤဖိုင်ပါရန် လိုသည်။ XLSX ကို PHP တွင်ရှိပြီးသား `Phar`, `DOM`, `zlib` ဖြင့် ဖတ်/ရေးသည်။ Composer/JavaScript package အသစ် မထည့်ထားပါ။ Upload သည် authenticated raw XLSX request ဖြင့် 2 MB အတွင်းသာ လက်ခံပြီး ယာယီဖိုင်ကို စစ်ဆေးပြီးချင်း ဖျက်သည်။ Preview အတည်ပြုချက်သည် မိနစ် ၃၀ သက်တမ်းရှိပြီး မူကြမ်း/သတ်မှတ်ချက် ပြောင်းလျှင် ဖိုင်ကို အသစ်ပြန်စစ်ရသည်။
