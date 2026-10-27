# Pwe Yon ဖိုင်နှင့် folder ခွဲထားပုံ

လက်ရှိ application က သုံးသောဖိုင်များ၊ development အတွက် လိုအပ်သောဖိုင်များနှင့် မချိတ်ဆက်တော့သော အဟောင်းဖိုင်များကို အောက်ပါအတိုင်း ခွဲထားသည်။

```text
D:\Pwal Yone\
├─ working\pweyon\              ← လက်ရှိ Laravel application
├─ development\
│  ├─ tools\                    ← စမ်းသပ်ရေး၊ build နှင့် စာတမ်းထုတ်သည့် tools
│  └─ runtime\                  ← tools/tests ထုတ်ပေးသည့် ယာယီဖိုင်များ
├─ reference\
│  ├─ originals\                ← မူရင်း HTML နှင့် PDF ၃ ဖိုင်
│  └─ extracted\                ← မူရင်းမှ ခွဲထုတ်ထားသော JS၊ PDF text နှင့် source inventory
├─ archive\
│  └─ private\                  ← အဟောင်း MySQL data၊ SQL backup နှင့် private config
├─ docs\                        ← လူဖတ်ရန် စာတမ်း၊ ဖိုင်ချိတ်ဆက်မှုစာရင်းနှင့် စမ်းသပ်မှတ်တမ်း
└─ README.md                    ← စတင်အသုံးပြုရန် လမ်းညွှန်
```

## တကယ်ချိတ်ဆက်ထားသော application ဖိုင်များ

`working/pweyon` ကို application root အဖြစ် ဆက်သုံးထားသည်။ Laravel ၏ ပုံမှန် directory ဖွဲ့စည်းပုံနှင့် လက်ရှိ URL များကို ထိန်းထားသည်။

| ဖိုင် / folder | လက်ရှိချိတ်ဆက်မှု |
|---|---|
| `public/index.php` | Browser request ဝင်သည့် entry |
| `bootstrap/app.php`, `config/`, `routes/` | Application စတင်ခြင်း၊ configuration နှင့် URL routing |
| `app/Http/Controllers/` | Login၊ workspace နှင့် API request ကို လက်ခံခြင်း |
| `app/Models/User.php` | အသုံးပြုသူ၊ password hash နှင့် login |
| `app/Domain/` | Database၊ ကုန်လက်ကျန်၊ ငွေကြေးနှင့် reports ဆိုင်ရာ လုပ်ငန်းစည်းမျဉ်းများ |
| `resources/views/auth/login.blade.php` | Login စာမျက်နှာ |
| `resources/views/workspace.blade.php` | Pwe Yon အဓိက interface |
| `resources/data/interface-defaults.json` | Projection service က ဖတ်သုံးသော interface ဖွဲ့စည်းပုံ |
| `public/js/server-bootstrap.js` | Server မှရသော data ကို interface အတွက် ပြင်ဆင်ခြင်း |
| `public/js/server-bridge.js` | Form များကို Laravel API နှင့် ချိတ်ဆက်ခြင်း |
| `public/js/server-reports.js` | Server report ရလဒ်များကို ပြသခြင်း |
| `public/js/source/`, `public/css/source/` | Workspace Blade က တကယ်ချိတ်၍ load လုပ်သည့် script/style များ |
| `vendor/` | Laravel/PHP က တကယ်အသုံးပြုသော Composer dependency tree |
| `.env` | လက်ရှိ MariaDB / port 3306 / `pweyon` ချိတ်ဆက်မှု |
| `storage/`, `bootstrap/cache/` | Framework အသုံးပြုသည့် session၊ log၊ cache နှင့် compiled view များ |

`public/js/source` နှင့် `public/css/source` သည် အမည်တွင် source ပါသော်လည်း လက်ရှိအလုပ်လုပ်နေသော မျက်နှာပြင်ဖိုင်များ ဖြစ်သည်။ မူရင်း HTML မှ ရည်ညွှန်းအဖြစ်ခွဲထုတ်ထားသော JS မိတ္တူများမှာ `reference/extracted/` ထဲတွင် ရှိသည်။

ချိတ်ဆက်ထားသော JS ဖိုင်တချို့အတွင်း ယခင် function နှင့် နောက်မှ override လုပ်ထားသော function များ အတူရှိနိုင်သည်။ ၎င်းတို့ကို ဖိုင်အဆင့်ဖြင့် အကုန်မသုံးဟု သတ်မှတ်၍ မရွှေ့ထားပါ။ လက်ရှိ view ၏ script အစီအစဉ်နှင့် API ချိတ်ဆက်မှုကို အခြေခံ၍ ခွဲထားသည်။

## Browser က တိုက်ရိုက်မသုံးသော်လည်း ဆက်လိုအပ်သောဖိုင်များ

- `database/migrations/` — Database တည်ဆောက်/ပြင်ဆင်ရန်။
- `database/factories/`, `tests/`, `phpunit.xml` — Test database သီးခြားဖြင့် စမ်းသပ်ရန်။ Login redirect ကို တကယ်စစ်သော `ExampleTest.php` ကိုလည်း ဆက်ထားသည်။
- `app/Console/Commands/`, `artisan` — Owner setup၊ workspace setup နှင့် diagnostics အတွက်။
- `composer.json`, `composer.lock` — PHP dependency နှင့် version များကို စီမံရန်။
- `AGENTS.md`, `CLAUDE.md`, `boost.json` — Development agent လမ်းညွှန်များ။
- `development/tools/` — Interface ထုတ်လုပ်ခြင်း၊ original source စိစစ်ခြင်း၊ browser/DOM စမ်းသပ်ခြင်းနှင့် Word စာတမ်းထုတ်ခြင်းအတွက်။

ဤဖိုင်များကို Laravel စံဖွဲ့စည်းပုံအတွင်း သင့်လျော်သောနေရာ၌ ထိန်းထားသည်။ `tests` နှင့် `database` ကို မရွှေ့ဘဲ output ဖိုင်များကိုသာ `development/runtime` သို့ ခွဲထားသည်။

## လက်ရှိ application နှင့် မချိတ်ဆက်သောဖိုင်များ

- `reference/originals/` ထဲက HTML/PDF များသည် အတည်ပြုထားသော မူရင်းရည်ညွှန်းဖိုင်များ ဖြစ်သည်။ Development build/source inspection ကသာ ဖတ်သုံးသည်။ Application request အတွင်း တိုက်ရိုက်မဖတ်ပါ။
- `reference/extracted/` သည် ရည်ညွှန်းစာတမ်း၊ မူရင်း script မိတ္တူနှင့် source inventory ဖြစ်သည်။
- မသုံးသော welcome page၊ Vite/Tailwind scaffold နှင့် ပြီးစီးသွားသော migration/organization script များကို အသုံးပြုသူညွှန်ကြားချက်အရ ဖျက်ပြီးဖြစ်သည်။ `archive/unused-scaffold/`၊ `archive/migration-tools/` နှင့် `archive/organization-tools/` မရှိတော့ပါ။
- Generated preview၊ test cache နှင့် ပြန်ထုတ်ယူနိုင်သော ယာယီဖိုင်များကိုလည်း ရှင်းထားသည်။ Test/စာတမ်း tool များကို run သည့်အခါ `development/runtime/` တွင် ပြန်ထွက်လာမည်။
- `archive/private/` သည် ပြန်လည်ရယူရေးအတွက် ထိန်းထားသော အဟောင်း data/backup ဖြစ်သည်။ လက်ရှိ database သည် XAMPP ၏ MariaDB ထဲတွင် ရှိနေပြီး ဤ archive ကို ဖတ်သုံးမနေပါ။

လျှို့ဝှက် configuration၊ backup နှင့် generated test/runtime ဖိုင်များကို `.gitignore` ဖြင့် ဖယ်ထားသည်။ Application ၏ လက်ရှိ `.env`၊ database နှင့် owner login ကို မပြောင်းထားပါ။

ဖိုင်တစ်ခုချင်းစီအတွက် [FILE_CONNECTIONS.csv](FILE_CONNECTIONS.csv) ကို Excel သို့မဟုတ် editor ဖြင့် ဖွင့်ကြည့်နိုင်သည်။ `CONNECTED_*` သည် application/framework က အသုံးပြုခြင်း၊ `DEVELOPMENT_*` သည် စမ်းသပ်/ဖွံ့ဖြိုးရေးအတွက်၊ `REFERENCE_ONLY` သည် မူရင်းရည်ညွှန်း၊ `NOT_RUNTIME_ARCHIVE` သည် လက်ရှိ application နှင့် မချိတ်ဆက်သောဖိုင်ဟု ခွဲပြထားသည်။ Dependency နှင့် private data folder အကြီးများကို တစ်ဖိုင်ချင်းမဖြန့်ဘဲ folder အလိုက် စာရင်းပြထားသည်။

ဤစာရင်းက code ချိတ်ဆက်မှုကို ရှင်းပြခြင်းဖြစ်သည်။ လုပ်ငန်းအသုံးပြုမှုအားလုံး အတည်ပြုပြီးကြောင်း မဆိုလိုပါ။ ကျန်ရှိသော စစ်ဆေးရန်အချက်များကို [KNOWN_GAPS.md](KNOWN_GAPS.md) တွင် ဆက်မှတ်တမ်းတင်ထားသည်။
