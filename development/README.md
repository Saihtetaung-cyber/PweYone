# Development အတွက်သာ အသုံးပြုသောဖိုင်များ

- `tools/` — မူရင်း source စိစစ်ခြင်း၊ interface ထုတ်လုပ်ခြင်း၊ browser/DOM စမ်းသပ်ခြင်းနှင့် စာတမ်းထုတ်ခြင်းအတွက်။
- `runtime/` — ထို tools နှင့် PHP tests များက ထုတ်ပေးသည့် preview၊ fixture၊ result နှင့် ယာယီ JSON ဖိုင်များ။ Git မှ ဖယ်ထားသည်။

Node dependencies သည် `tools/node_modules/` တွင်ရှိသည်။ ဤ folder သည် လက်ရှိ PHP backend ကို လည်ပတ်စေသည့် server မဟုတ်ပါ။

Tool command များကို workspace root `D:\Pwal Yone` မှ run ပါ။ ဥပမာ—

```powershell
node development/tools/build-interface.cjs
node development/tools/source-manifest.cjs
node development/tools/test-interface.cjs
node development/tools/file-map.cjs
```

PHP database tests ကို `working/pweyon` မှ run ပါ။ ယာယီဖိုင်များ ရှင်းထားသည့်အခါ DOM test input များကို `php vendor/phpunit/phpunit/phpunit --filter 'original_interface|closing_snapshot|historical_today_purchase'` ဖြင့် အရင်ပြန်ထုတ်ပါ။ Browser fixture နှင့် PHPUnit suite ကို တစ်ချိန်တည်း မ run ပါနှင့်။ အသေးစိတ် command များကို [root README](../README.md) တွင် ကြည့်ပါ။
