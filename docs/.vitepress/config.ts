import tailwindcss from '@tailwindcss/vite'
import type { PluginOption } from 'vite'
import { defineConfig } from 'vitepress'

const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  title: 'Tag Extractor',
  description: 'A TypeScript library to extract configured tags from short agreement narratives using small browser models',
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
  ],
  vite: {
    plugins: [tailwindcss() as unknown as PluginOption],
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Example', link: '/guide/example' },
      { text: 'Guide', link: '/guide/what-is-this' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'What Is This?', link: '/guide/what-is-this' },
          { text: 'API', link: '/guide/api' },
          { text: 'Authoring', link: '/guide/authoring' },
          { text: 'Known Limitations', link: '/guide/known-limitations' },
          { text: 'Example', link: '/guide/example' },
        ],
      },
      {
        text: 'Reports',
        items: [
          { text: 'Reports Overview', link: '/guide/reports-overview' },
          { text: 'Main Benchmark', link: '/guide/main-benchmark' },
          { text: 'Model Bakeoff', link: '/guide/model-bakeoff' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/omarmir/tag-extractor' },
    ],
  },
})
