---
title: "プログラミング不要！AIの『キャンバス（Canvas）』機能を使って自分専用の便利ツールを作る方法"
description: "ChatGPTのCanvas機能やClaudeのArtifacts機能を活用し、プログラミングの知識ゼロで簡単なWebアプリ（タイマー、チェックリスト、簡易電卓など）を作成・動作させる手順を解説します。"
category: "実践アプリ開発"
publishDate: "2026-06-14"
eyecatch: "/images/ai_canvas_apps.png"
isPublished: true
---

## チャットの横でアプリが動く！画期的な「キャンバス機能」

最近の主要な生成AI（ChatGPTの「Canvas」やClaudeの「Artifacts」など）には、通常のチャット画面とは別に、**ソースコードや作成中の成果物を別ウィンドウで表示・編集できる「キャンバス機能」**が搭載されています。

この機能の凄いところは、HTMLやJavaScriptなどのプログラムコードをAIが書き出すと、**その場（ブラウザ上）で実際に動作するミニアプリとなって表示され、プレビューできる点**です。

プログラミングを全く知らなくても、日本語で指示を出すだけで自分専用の便利なアプリを数分で作ることができます。

---

## 🔍 【実例】70歳の方が家族のために作った「お薬飲み忘れ防止チェッカー」

当スクール「StepSchool」で紹介したテクニックをもとに、実際に**70歳の方が、薬を飲み忘れてしまう家族のために自作した「お薬飲み忘れ防止チェッカー」**の実例（一次情報）を紹介します。

制作者の方はパソコンの基本操作ができる程度で、プログラムは一切書けませんでした。しかし、AIのキャンバス機能を使い、以下のように対話を進めてアプリを完成させました。

### 💬 AIへの具体的な指示の流れ
1. **最初の指示**:
   > 「70代の家族が薬を飲み忘れないように、朝・昼・晩に飲んだらチェックを入れられるシンプルなホームページを作って。スマートフォンの画面で見やすい大きな文字にしてください。」
   - **結果**: 数秒で、画面の右側にチェックリストのプロトタイプが立ち上がりました。
2. **デザインの調整指示**:
   > 「背景を優しい薄緑色にして、チェックボタンを押しやすいように大きく丸いボタンにしてください。」
   - **結果**: シニア世代でも見やすく、押しやすい大きなボタンに瞬時に書き換えられました。
3. **さらに機能を追加**:
   > 「全部チェックが入ったら『今日もばっちり！』と可愛いイラストや文字が表示されるようにして、翌朝にはリセットできるボタンもつけて。」
   - **結果**: 条件クリア時のメッセージと、データを一発でクリアするリセットボタンが追加されました。

---

## 📋 実際にキャンバスで生成された「お薬チェッカー」のコード

以下は、その際にAIが生成し、実際にスマートフォンで動作しているプログラム（HTMLコード）です。
このコードをコピーして自分のパソコン等に保存するだけで、すぐに同じチェッカーが動き出します。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>お薬飲み忘れ防止チェッカー</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f7f4;
      color: #2c3e50;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    h1 { font-size: 24px; color: #2e7d32; margin-bottom: 25px; }
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 10px;
      border-bottom: 1px solid #eee;
    }
    label { font-size: 20px; font-weight: bold; }
    input[type="checkbox"] {
      width: 30px;
      height: 30px;
      cursor: pointer;
      accent-color: #2e7d32;
    }
    .message {
      margin-top: 25px;
      font-size: 22px;
      font-weight: bold;
      color: #d32f2f;
      min-height: 30px;
    }
    .btn-reset {
      margin-top: 20px;
      padding: 12px 25px;
      font-size: 16px;
      background-color: #2e7d32;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
    }
    .btn-reset:hover { background-color: #1b5e20; }
  </style>
</head>
<body>
  <div class="container">
    <h1>お薬チェッカー 💊</h1>
    <div class="item">
      <label for="morning">☀️ 朝のくすり</label>
      <input type="checkbox" id="morning" onchange="checkStatus()">
    </div>
    <div class="item">
      <label for="noon">☁️ 昼のくすり</label>
      <input type="checkbox" id="noon" onchange="checkStatus()">
    </div>
    <div class="item">
      <label for="night">🌙 夜のくすり</label>
      <input type="checkbox" id="night" onchange="checkStatus()">
    </div>
    
    <div class="message" id="msg"></div>
    <button class="btn-reset" onclick="resetForm()">すべてリセット（翌朝用）</button>
  </div>

  <script>
    function checkStatus() {
      const m = document.getElementById('morning').checked;
      const n = document.getElementById('noon').checked;
      const nt = document.getElementById('night').checked;
      const msg = document.getElementById('msg');
      
      if (m && n && nt) {
        msg.innerHTML = "🎉 今日もばっちり！完璧です！";
        msg.style.color = "#2e7d32";
      } else {
        msg.innerHTML = "薬の飲み忘れに気をつけましょう！";
        msg.style.color = "#d32f2f";
      }
    }
    function resetForm() {
      document.getElementById('morning').checked = false;
      document.getElementById('noon').checked = false;
      document.getElementById('night').checked = false;
      document.getElementById('msg').innerHTML = "";
    }
  </script>
</body>
</html>
```

---

## 💾 完成したアプリを自分のパソコンやスマホで使う方法

キャンバス画面で動作するアプリが完成したら、以下の手順で身内のデバイスに保存して、いつでも使えるようになります。

1. **コードをダウンロードまたはコピーする**: キャンバス画面の右上にある「ダウンロード（矢印アイコン）」をクリックするか、上記のコードを丸ごとコピーします。
2. **ファイルとして保存する**: パソコンのテキストエディタ等にコードを貼り付け、ファイル名を `okuri.html` などのように、最後が `.html` になる形で保存します。
3. **スマホに移す**: 保存したファイルを、メールやLINE等でご家族のスマートフォンへ送付し、ブラウザ（SafariやChrome）のブックマークや「ホーム画面に追加」をしておくことで、毎日の操作が一発で可能になります。

---

## まとめ：アイデア次第で身近な人を助けるツールが作れる

このお薬チェッカーの例のように、キャンバス機能は「自分や大切な家族のちょっとした困りごと」を解決するツールを作るのに最適です。

プログラミングを学ぶための時間やコストをかけることなく、AIに「これを作って」と頼むだけで、実用的なものがその場で手に入ります。ぜひ、身の回りの課題を解決するアイデアをAIに話しかけてみてください！
