import { defineCollection, z } from 'astro:content';

const articlesCollection = defineCollection({
  type: 'content', // Markdown または MDX
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string(),
    // YAML の日付形式をJSの Date オブジェクトに変換
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    eyecatch: z.string(), // 画像URL (ローカルパスまたは外部URL)
    isPublished: z.boolean().default(true),
  }),
});

const promptsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    target: z.string(),
    difficulty: z.enum(['初級', '中級', '上級']),
    recommendedAI: z.string(),
    publishDate: z.coerce.date(),
    isPublished: z.boolean().default(true),
  }),
});

// コレクションをエクスポート
export const collections = {
  articles: articlesCollection,
  prompts: promptsCollection,
};
