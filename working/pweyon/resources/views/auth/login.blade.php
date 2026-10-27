<!doctype html>
<html lang="my">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#2c64a8">
    <title>ပွဲရုံ · ဝင်ရန်</title>
    <style>
        :root { color-scheme: light; --blue: #2c64a8; --ink: #183849; }
        * { box-sizing: border-box; }
        body { margin: 0; color: var(--ink); background: #f5f8fc; font-family: "Myanmar Text", "Pyidaungsu", "Noto Sans Myanmar", sans-serif; }
        .login-layout { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; min-height: 100svh; }
        .intro { display: flex; flex-direction: column; min-height: 580px; padding: 58px 10% 48px; background: var(--blue); color: #fff; }
        .brand { display: flex; align-items: center; gap: 18px; line-height: 1.6; font-size: 27px; font-weight: 700; }
        .brand svg { width: 30px; height: 30px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
        .intro-copy { margin: auto 0; padding: 60px 0; }
        .eyebrow { margin: 0 0 15px; color: #c3d5e9; font-size: 13px; line-height: 1.9; }
        .intro h1 { margin: 0; font-size: clamp(28px, 2.8vw, 36px); line-height: 1.5; font-weight: 700; letter-spacing: -.6px; }
        .intro-description { margin: 20px 0 0; color: #c3d5e9; font-size: 14px; line-height: 2; }
        .intro-footer { margin: 0; color: #d6e3f2; font-size: 13px; line-height: 1.9; }
        .login-panel { display: flex; align-items: center; justify-content: center; padding: 64px 40px; }
        .login-content { width: 100%; max-width: 432px; }
        .small-brand { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 32px; margin-bottom: 16px; border-radius: 8px; background: #eff4f9; color: #849caf; font-size: 12px; }
        h2 { margin: 0 0 8px; font-size: 27px; line-height: 1.7; font-weight: 700; }
        .welcome { margin: 0 0 22px; color: #8a98a4; font-size: 14px; line-height: 1.9; }
        .field { margin-bottom: 19px; }
        label { display: block; margin-bottom: 9px; color: #385468; font-size: 12px; line-height: 1.9; font-weight: 700; }
        input { width: 100%; height: 47px; padding: 10px 14px; border: 1px solid #e1e7ee; border-radius: 10px; background: #fff; color: var(--ink); font: 15px "Myanmar Text", sans-serif; box-shadow: 0 1px 2px #18384903; transition: border-color .15s, box-shadow .15s; }
        input:focus-visible { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px #2c64a81c; }
        button { display: block; width: 100%; min-height: 47px; margin-top: 27px; padding: 10px 18px; border: 0; border-radius: 10px; background: var(--blue); color: #fff; font: 700 14px "Myanmar Text", sans-serif; cursor: pointer; transition: background .15s; }
        button:hover { background: #24558f; }
        button:focus-visible { outline: 3px solid #8db4e0; outline-offset: 3px; }
        .help { margin: 16px 0 0; color: #919faa; font-size: 12px; line-height: 1.9; }
        .error { margin: 0 0 18px; padding: 11px 14px; border: 1px solid #f2caca; border-radius: 9px; background: #fff1f1; color: #a52f37; font-size: 13px; line-height: 1.8; }
        @media (max-width: 900px) { .intro { padding: 42px 32px; } .intro h1 { font-size: 29px; } .login-panel { padding: 48px 32px; } }
        @media (max-width: 640px) {
            .login-layout { grid-template-columns: 1fr; }
            .intro { min-height: auto; padding: 26px 28px 30px; }
            .brand { gap: 12px; font-size: 23px; }
            .brand svg { width: 25px; height: 25px; }
            .intro-copy { margin: 0; padding: 25px 0 0; }
            .eyebrow { margin-bottom: 10px; font-size: 12px; }
            .intro h1 { font-size: 27px; line-height: 1.65; }
            .intro-description { margin-top: 14px; font-size: 12px; }
            .intro-footer { display: none; }
            .login-panel { padding: 34px 28px 42px; }
            .small-brand { display: none; }
            h2 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <main class="login-layout">
        <section class="intro" aria-label="ပွဲရုံ မိတ်ဆက်">
            <div class="brand">
                <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27V9M16 16C9 16 7 12 7 8c6 0 9 3 9 8ZM16 21c7 0 10-4 10-8-6 0-10 3-10 8Z"/></svg>
                <span>ပွဲရုံ</span>
            </div>
            <div class="intro-copy">
                <p class="eyebrow">နေ့စဉ်လုပ်ငန်းကို ရှင်းရှင်းလင်းလင်း</p>
                <h1>အရောင်း၊ ငွေစာရင်းနှင့်<br>ပေးရန် / ရရန်ကို<br>တစ်နေရာတည်း ကြည့်မယ်။</h1>
                <p class="intro-description">သင့်အကောင့်ရဲ့ လုပ်ပိုင်ခွင့်အတိုင်း ဝင်ရောက်အသုံးပြုပါ။</p>
            </div>
            <p class="intro-footer">ပွဲရုံ · နေ့စဉ်လုပ်ငန်းစီမံမှု</p>
        </section>
        <section class="login-panel" aria-labelledby="login-title">
            <div class="login-content">
                <div class="small-brand" aria-hidden="true">ပွဲရုံ</div>
                <h2 id="login-title">အကောင့်ဝင်မယ်</h2>
                <p class="welcome">သင့်လုပ်ငန်းစာမျက်နှာကို ဆက်ဝင်ပါ။</p>
                @if($errors->any())
                    <p class="error" role="alert">{{ $errors->first() }}</p>
                @endif
                <form method="post" action="{{ route('login') }}">
                    @csrf
                    <div class="field">
                        <label for="email">အကောင့်အမည် (Email)</label>
                        <input id="email" name="email" type="email" autocomplete="username" value="{{ old('email') }}" required>
                    </div>
                    <div class="field">
                        <label for="password">စကားဝှက်</label>
                        <input id="password" name="password" type="password" autocomplete="current-password" required>
                    </div>
                    <button type="submit">ဝင်ရောက်မယ်</button>
                </form>
                <p class="help">ကိုယ်ပိုင်အကောင့်ဖြင့်သာ ဝင်ရောက်ပါ။ အကောင့်မရှိသေးလျှင် စနစ်တာဝန်ရှိသူထံ ဆက်သွယ်ပါ။</p>
            </div>
        </section>
    </main>
</body>
</html>
