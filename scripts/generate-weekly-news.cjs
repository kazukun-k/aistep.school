const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const isMock = process.argv.includes('--mock');
  
  if (!apiKey && !isMock) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
  }

  const today = new Date();
  // Format dates
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Calculate start date (7 days ago)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  const startY = oneWeekAgo.getFullYear();
  const startM = String(oneWeekAgo.getMonth() + 1).padStart(2, '0');
  const startD = String(oneWeekAgo.getDate()).padStart(2, '0');
  const startDateStr = `${startY}/${startM}/${startD}`;
  const endDateStr = `${yyyy}/${mm}/${dd}`;

  if (isMock) {
    const mockContent = `---
title: "週刊生成AIニュースまとめ（${yyyy}年${mm}月${dd}日版）"
description: "今週（${startDateStr}〜${endDateStr}）に発表された生成AIに関する主要ニュースを、初心者向けに要約してお届けします。"
category: "生成AI初心者"
publishDate: "${dateStr}T07:00:00+09:00"
eyecatch: "/images/weekly-news-eyecatch.png"
isPublished: true
---

## テスト用の最新AIニュース記事

これはローカル環境でのビルド確認および未来日フィルターの検証用テストデータです。

### 1. Geminiの新しい開発アップデート
Googleが新しいGemini APIモデルを開発者向けにアップデート。推論性能と速度が向上しています。

### 2. 今後の展望について
AIの自動投稿やスケジューリング機能により、ブログの更新がより省力化されます。
`;
    const outputDir = path.join(__dirname, '..', 'src', 'content', 'articles');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFilePath = path.join(outputDir, `weekly-ai-news-${dateStr}.md`);
    fs.writeFileSync(outputFilePath, mockContent, 'utf8');
    console.log(`[MOCK] Successfully generated article: ${outputFilePath}`);
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash as it supports search grounding
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: [{ googleSearch: {} }],
  });

  const prompt = `
あなたはプロのAIジャーナリストであり、IT初心者に教えるスクールの講師です。
Google検索ツールを使って、過去1週間（${startDateStr}〜${endDateStr}）の間に発表された、「生成AI（例：OpenAI、ChatGPT、Anthropic、Claude、Google、Gemini、Microsoft、Metaなど）」に関する重要なニュース・製品アップデートを検索し、収集してください。

集めたニュースの中から、特に重要で一般のビジネスパーソンやAI初心者にも関わりの深い話題を3件から5件選んでください。

選定したニュースをもとに、初心者向けに分かりやすく解説するまとめ記事を作成してください。
記事は以下の構成とし、Markdown形式で出力してください：

1. 導入（今週のAIトレンドの全体像と特徴を手短に解説）
2. 各ニュースの個別解説：
   - ニュースの見出し（## でマークダウン）
   - 何が起こったのか、何が新しいのか（初心者にも分かりやすく丁寧に説明）
   - 私たちの仕事や日常生活にどう役立つか、どんな影響があるか（具体的な実務への活用例などを提示）
   - ソースへの参照リンク（例：「詳細ソース：[OpenAI Blog](URL)」のように、検索した実際の公式情報元やニュースサイトへのMarkdownリンクを含めてください）
3. 全体のまとめ（これからの展望や、初心者が今すぐ試せることなど）

【重要ルール】
- 初心者向けに、専門用語（マルチモーダル、API、LLMなど）を適宜分かりやすくかみ砕いて説明してください。
- 出力は純粋なマークダウンテキストのみとしてください。冒頭や末尾に「承知しました」「この記事はいかがでしょうか」といった不要な応答テキストは含めないでください。
- マークダウンをコードブロック（\`\`\`markdown ... \`\`\`）で囲まないでください。
- 記事のタイトル（# タイトル）は含めないでください（フロントマターで設定するため）。
`;

  try {
    console.log("Generating weekly AI news summary via Gemini API...");
    const result = await model.generateContent(prompt);
    let bodyText = result.response.text();

    // Clean up response if the model accidentally wrapped it in code block
    bodyText = bodyText.trim();
    if (bodyText.startsWith("```markdown")) {
      bodyText = bodyText.substring(11).trim();
    } else if (bodyText.startsWith("```")) {
      bodyText = bodyText.substring(3).trim();
    }
    if (bodyText.endsWith("```")) {
      bodyText = bodyText.substring(0, bodyText.length - 3).trim();
    }

    const title = `週刊生成AIニュースまとめ（${yyyy}年${mm}月${dd}日版）`;
    const description = `今週（${startDateStr}〜${endDateStr}）に発表された生成AIに関する主要ニュースを、初心者向けに要約してお届けします。`;

    // Construct the full Markdown content with Astro frontmatter
    const fileContent = `---
title: "${title}"
description: "${description}"
category: "生成AI初心者"
publishDate: "${dateStr}T07:00:00+09:00"
eyecatch: "/images/weekly-news-eyecatch.png"
isPublished: true
---

${bodyText}
`;

    const outputDir = path.join(__dirname, '..', 'src', 'content', 'articles');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `weekly-ai-news-${dateStr}.md`);
    fs.writeFileSync(outputFilePath, fileContent, 'utf8');

    console.log(`Successfully generated article: ${outputFilePath}`);
  } catch (error) {
    console.error("Error generating weekly news article:", error);
    process.exit(1);
  }
}

main();
