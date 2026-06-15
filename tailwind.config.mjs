/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // メディアサイトに合うフォントやカラーパレットの拡張があればここに記述
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans JP',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    // Markdownの装飾（proseクラス）を有効にするプラグイン
    require('@tailwindcss/typography'),
  ],
};
