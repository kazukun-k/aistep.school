const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const { generateEyecatch } = require('./utils/image-generator.cjs');

// .env から環境変数を手動ロードする（dotenv非依存）
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is not set.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function getExistingArticles() {
  const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles');
  if (!fs.existsSync(articlesDir)) {
    return [];
  }
  return fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      const titleMatch = content.match(/title:\s*"(.*?)"/);
      return titleMatch ? titleMatch[1] : '';
    })
    .filter(Boolean);
}

async function main() {
  const dateStr = new Date().toISOString().split('T')[0];
  const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles');
  
  const existingArticles = getExistingArticles();
  
  const prompt = `あなたは、日本のビジネスパーソンに向けて、生成AIの日常や仕事での具体的な使い方を優しく解説するブロガー「しゅう」です。

【超重要ターゲット】
今回の記事のターゲット読者は「生成AI初心者（パソコンやスマホの基本的な操作はできるが、ITやプログラミングに強い苦手意識を持つ人）」です。
「パイソン（Python）」や「プログラミング」「マクロ」といった言葉を聞くだけで、自分には関係のない難しいものだと感じて読むのをやめてしまいます。
そのため、プログラミングやIT技術的な話題は一切避け、スマホやパソコンの基本操作（文字入力やコピペ）だけで今すぐ試せる「日常や仕事が少し楽になる身近な活用アイデア」を提案・解説してください。

これまでの記事タイトル（重複しないようにしてください）：
${existingArticles.map(t => `- ${t}`).join('\n')}

上記を踏めて、これまでと重複しない、新しいテーマを1つ選び、記事を執筆してください。

記事は以下の構成とし、Markdown形式で出力してください：
1. 導入（なぜそのテーマが日常や仕事で役立つのか、何が解決するのかを、難しい言葉を使わずに共感しやすく解説）
2. 具体的な解説（スマホやパソコンでの実際の操作手順を、ステップ形式でわかりやすく解説してください。また、そのままコピペして使える日本語の『指示文（AIへのお願いの書き方）』のテンプレート例を必ず含めてください）
3. 使う上での注意点やコツ（AIがたまに間違った答えを出してしまうことへの対策などを、専門用語を使わずに優しく解説）
4. まとめ（読者の背中を押すエール・今日からできる最初のアクション）

【重要ルール】
- **プログラミングに関連する言葉（Python、パイソン、VBA、GAS、マクロ、JavaScript、コード、プログラムなど）や、難解なAI・ITの専門用語（LLM、ファインチューニング、トークン、パラメータ、RAG、マルチモーダル、ベクトルなど）は【絶対に】使用しないでください。**
- 難しく聞こえるAI用語は、必ず直感的に理解できる優しい日本語にかみ砕いて表現してください。
  - プロンプト ➡ 「AIへの指示文」「AIへのお願いの書き方」
  - ハルシネーション ➡ 「AIの嘘や一時的な勘違い」
  - Grounding ➡ 「最新の検索結果に基づいた回答」
  - APIやインテグレーション ➡ 「他のソフトと繋げること」「連携」
- カテゴリは、「生成AI初心者」「業務効率化」「プロンプト」の3つの中から最も適したものを1つ選択してください。
- 記事の概要（description）を100〜150文字程度で考えてください。
- 記事のタイトル（title）を考えてください。
- 記事本文のMarkdownを出力してください。タイトル（# タイトル）は本文には含めないでください（フロントマターで設定するため）。
- 回答の最後または別途パースしやすいように、フロントマター用メタデータを以下のJSON形式で、記事本文の【末尾】に必ず出力してください：
  [METADATA_JSON: {"title": "記事タイトル", "description": "概要文", "category": "選択したカテゴリ"}]
- 出力は指示されたマークダウン本文と指示タグ（[EYECATCH_TEXT: ...]および[METADATA_JSON: ...]）のみとしてください。不要な応答テキスト（「かしこまりました」など）や、全体をコードブロック（\`\`\`markdown\`）で囲むことはしないでください。
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
    let catchphrase = "生成AI活用法\n基本ガイド";
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
