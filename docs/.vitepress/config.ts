import { cpSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import type { PluginOption } from 'vite'
import { defineConfig } from 'vitepress'

const base = process.env.VITE_BASE_PATH ?? '/'
const configDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base,
  title: 'Tag Extractor',
  description: 'A TypeScript library to extract fixed taxonomy tags and dynamic phrase tags from plain text using small browser models',
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
  ],
  vite: {
    plugins: [
      tailwindcss() as unknown as PluginOption,
      copyBundledModels() as unknown as PluginOption,
    ],
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

function copyBundledModels() {
  return {
    name: 'copy-bundled-tag-extractor-models',
    closeBundle() {
      const source = resolve(configDir, '../../library/models')
      const target = resolve(configDir, '../.vitepress/dist/models')
      if (existsSync(source)) {
        cpSync(source, target, { recursive: true })
      }
    },
  }
}
