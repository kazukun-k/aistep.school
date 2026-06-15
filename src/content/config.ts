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

// コレクションをエクスポート
export const collections = {
  articles: articlesCollection,
};
