import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import remarkCjkFriendly from 'remark-cjk-friendly';

// 本番ドメインの設定（環境変数 SITE_URL から取得し、デフォルトは https://example.com）
const siteUrl = process.env.SITE_URL || 'https://example.com';

// サブディレクトリ配下（例: /blog）で配信するためのベースパス
// 環境変数 BASE_PATH から取得し、デフォルトはルート（/）
let basePath = process.env.BASE_PATH || '/';
if (!basePath.startsWith('/')) {
  basePath = '/' + basePath;
}
if (!basePath.endsWith('/')) {
  basePath = basePath + '/';
}

// 環境変数によって出力先ディレクトリ（outDir）を調整する仕組み（必要に応じてカスタマイズ可能）
const outDir = process.env.OUT_DIR || 'dist';

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  base: basePath,
  outDir: outDir,
  output: 'static', // 静的サイト生成 (SSG)
  integrations: [
    tailwind({
      // tailwind.config.mjs を明示的に読み込む
      configFile: './tailwind.config.mjs',
    }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkCjkFriendly,
    ],
  },
});
