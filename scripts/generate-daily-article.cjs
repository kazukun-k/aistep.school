const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateEyecatch } = require('./utils/image-generator.cjs');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const isMock = process.argv.includes('--mock');

  if (!apiKey && !isMock) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // 1. Read existing articles to prevent duplicate topics
  const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles');
  let existingTopicsList = "";
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    const topics = files.map(file => {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      const titleMatch = content.match(/^title:\s*"([^"]+)"/m) || content.match(/^title:\s*'([^']+)'/m);
      return titleMatch ? titleMatch[1] : file.replace('.md', '');
    });
    existingTopicsList = topics.map(t => `- ${t}`).join('\n');
  }

  if (isMock) {
    const mockContent = `---
title: "ChatGPTで作業効率を10倍にするショートカット活用術"
description: "毎日のChatGPTとの対話作業。キーボードショートカットやちょっとした小技を知るだけで、執筆やリサーチの速度が圧倒的に向上します。"
category: "業務効率化"
publishDate: "${dateStr}T07:00:00+09:00"
eyecatch: "/images/daily-article-${dateStr}.png"
isPublished: true
---

## ChatGPT作業をスピードアップするテクニック

AIツールを使いこなす上で、タイピングや画面操作の手間を省くことは重要です。

### 1. キーボードショートカットを活用する
ChatGPTのチャット欄では、以下のショートカットが有効です：
- **Shift + Enter**: 改行（誤送信を防ぐ）
- **Ctrl + Shift + O** (または Cmd + Shift + O): 新規チャットを開く

### 2. プロンプトはあらかじめメモ帳に用意する
よく使うひな形は辞書登録しておくか、メモアプリにストックしておき、コピペして使い回すことで入力時間を劇的に節約できます。
`;
    const outputFilePath = path.join(articlesDir, `daily-article-${dateStr}.md`);
    fs.writeFileSync(outputFilePath, mockContent, 'utf8');
    console.log(`[MOCK] Successfully generated daily article: ${outputFilePath}`);

    // Generate mock image
    try {
      const imgPath = path.join(__dirname, '..', 'public', 'images', `daily-article-${dateStr}.png`);
      await generateEyecatch('業務効率化', 'ChatGPTを時短する\nショートカット活用術', imgPath);
    } catch (err) {
      console.error("Failed to generate mock eyecatch image:", err);
    }
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash for daily articles as well
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  }, { apiVersion: 'v1' });

  const prompt = `
あなたはIT・AI初心者にやさしく生成AIの活用法を教える専門スクールの講師です。
一般の会社員やビジネスパーソンが、明日から実務や日常生活ですぐに使える「生成AIの活用ノウハウ、プロンプトテクニック、業務効率化のアイデア」に関する良質な解説記事を執筆してください。

現在、サイト内にはすでに以下のトピックの記事が存在します：
${existingTopicsList}

上記に挙げた既存記事のテーマと【絶対に重複しない】、新しいテーマを1つ選び、記事を執筆してください。

記事は以下の構成とし、Markdown形式で出力してください：
1. 導入（なぜそのテーマが重要なのか、何が解決するのか）
2. 具体的な解説や手順（ステップ形式や具体的なプロンプトのテンプレート例を含めてください）
3. 実務で使う上での注意点やコツ
4. まとめ（読者へのエールや、今日からできるアクション）

【重要ルール】
- 記事のテキスト本文を出力する前に、記事のアイキャッチ画像（白いカード付き）に記載する、記事タイトルを要約した短いキャッチコピー（サブ見出しとメイン見出しの2行）を、必ず以下の形式で一番最初の行に出力してください。
  [EYECATCH_TEXT: 1行目の短い見出し\\n2行目の大きなメインタイトル]
  例：[EYECATCH_TEXT: AIでExcel作業が\\n10倍速くなる方法]
- カテゴリは、「生成AI初心者」「業務効率化」「プロンプト」の3つの中から最も適したものを1つ選択してください。
- 記事の概要（description）を100〜150文字程度で考えてください。
- 記事のタイトル（title）を考えてください。
- 記事本文のMarkdownを出力してください。タイトル（# タイトル）は本文には含めないでください（フロントマターで設定するため）。
- 回答の最後または別途パースしやすいように、フロントマター用メタデータを以下のJSON形式で、記事本文の【末尾】に必ず出力してください：
  [METADATA_JSON: {"title": "記事タイトル", "description": "概要文", "category": "選択したカテゴリ"}]
- 出力は指定されたマークダウン本文と指定のタグ（[EYECATCH_TEXT: ...]および[METADATA_JSON: ...]）のみとしてください。不要な応答テキスト（「かしこまりました」など）や、全体をコードブロック（\`\`\`markdown）で囲むことはしないでください。
`;

  try {
    console.log("Generating daily AI article via Gemini API...");
    const result = await model.generateContent(prompt);
    let bodyText = result.response.text().trim();

    // Clean up response if the model wrapped it in code block
    if (bodyText.startsWith("```markdown")) {
      bodyText = bodyText.substring(11).trim();
    } else if (bodyText.startsWith("```")) {
      bodyText = bodyText.substring(3).trim();
    }
    if (bodyText.endsWith("```")) {
      bodyText = bodyText.substring(0, bodyText.length - 3).trim();
    }

    // 1. Extract catchphrase for image generation
    let catchphrase = "生成AI活用法\n基本ガイド！";
    const eyecatchMatch = bodyText.match(/^\[EYECATCH_TEXT:\s*([\s\S]+?)\]/);
    if (eyecatchMatch) {
      catchphrase = eyecatchMatch[1].trim();
      bodyText = bodyText.replace(/^\[EYECATCH_TEXT:\s*[\s\S]+?\]/, '').trim();
    }

    // 2. Extract Metadata JSON
    let title = "最新の生成AI活用ガイド";
    let description = "生成AIを日常やビジネスで活用するための初心者向け解説記事です。";
    let category = "生成AI初心者";

    const metaMatch = bodyText.match(/\[METADATA_JSON:\s*([\s\S]+?)\]/);
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1].trim());
        if (meta.title) title = meta.title;
        if (meta.description) description = meta.description;
        if (meta.category) category = meta.category;
      } catch (e) {
        console.error("Failed to parse metadata JSON:", e);
      }
      bodyText = bodyText.replace(/\[METADATA_JSON:\s*[\s\S]+?\]/, '').trim();
    }

    const eyecatchFileName = `daily-article-${dateStr}.png`;

    // Construct the full Markdown content with Astro frontmatter
    const fileContent = `---
title: "${title}"
description: "${description}"
category: "${category}"
publishDate: "${dateStr}T07:00:00+09:00"
eyecatch: "/images/${eyecatchFileName}"
isPublished: true
---

${bodyText}
`;

    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }

    // Write article
    const outputFilePath = path.join(articlesDir, `daily-article-${dateStr}.md`);
    fs.writeFileSync(outputFilePath, fileContent, 'utf8');
    console.log(`Successfully generated article: ${outputFilePath}`);

    // Generate eyecatch image
    const imgOutputPath = path.join(__dirname, '..', 'public', 'images', eyecatchFileName);
    try {
      console.log(`Generating unique eyecatch image for category "${category}" with text: "${catchphrase.replace('\n', ' ')}"`);
      await generateEyecatch(category, catchphrase, imgOutputPath);
    } catch (imageError) {
      console.error("Failed to generate custom eyecatch image:", imageError);
    }

  } catch (error) {
    console.error("Error generating daily article:", error);
    process.exit(1);
  }
}

main();
