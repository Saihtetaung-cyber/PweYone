# ပြန်လည်ရယူရေး backup များ

အသုံးပြုသူ၏ ဖျက်ရန်ညွှန်ကြားချက်အရ မလိုအပ်သော `unused-scaffold/`၊ `migration-tools/`၊ `organization-tools/` နှင့် အဟောင်း installer ZIP ကို ဖျက်ပြီးဖြစ်သည်။

`private/` တွင် အဟောင်း MySQL server/data၊ SQL backup နှင့် private environment backup များကို ပြန်လည်ရယူနိုင်ရန် ထိန်းထားသည်။ ဤ folder တစ်ခုလုံးကို Git မှ ဖယ်ထားသည်။ ပြန်သုံးမည်ဆိုလျှင် [database recovery record](../docs/MARIADB_SWITCH.md) ကို အရင်ကြည့်ပါ။

လက်ရှိ database သည် XAMPP MariaDB၊ port **3306** ဖြစ်သည်။ ၎င်း၏ data directory နှင့် လက်ရှိ application ဖိုင်များကို မဖျက်ထားပါ။
