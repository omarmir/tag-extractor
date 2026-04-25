import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type PackageManifest = {
  name: string
  version: string
  private?: boolean
  type?: string
  main?: string
  module?: string
  types?: string
  exports?: Record<string, string>
  files?: string[]
  peerDependencies?: Record<string, string>
  sideEffects?: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const libraryDir = resolve(repoRoot, 'library')
const outDir = resolve(repoRoot, 'tools/package-release')
const distDir = resolve(libraryDir, 'dist')
const modelsDir = resolve(libraryDir, 'models')
const version = resolveReleaseVersion(process.argv[2] ?? process.env.RELEASE_VERSION ?? '')

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

const manifest = JSON.parse(await readFile(resolve(libraryDir, 'package.json'), 'utf8')) as PackageManifest

await assertDistExists()
await assertModelsExist()
await copyPath(distDir, resolve(outDir, 'dist'))
await copyPath(modelsDir, resolve(outDir, 'models'))
await copyPath(resolve(libraryDir, 'README.md'), resolve(outDir, 'README.md'))
await copyPath(resolve(libraryDir, 'AUTHORING_GUIDE.md'), resolve(outDir, 'AUTHORING_GUIDE.md'))
await copyPath(resolve(libraryDir, 'KNOWN_LIMITATIONS.md'), resolve(outDir, 'KNOWN_LIMITATIONS.md'))
await copyPath(resolve(repoRoot, 'LICENSE.md'), resolve(outDir, 'LICENSE.md'))

const stagedManifest: PackageManifest = {
  name: manifest.name,
  version,
  type: 'module',
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    '.': './dist/index.js',
    './benchmark': './dist/benchmark.js',
    './worker-runtime': './dist/worker-runtime.js',
  },
  files: [
    'dist',
    'models',
    'README.md',
    'AUTHORING_GUIDE.md',
    'KNOWN_LIMITATIONS.md',
    'LICENSE.md',
  ],
  peerDependencies: manifest.peerDependencies,
  sideEffects: false,
}

await writeFile(resolve(outDir, 'package.json'), `${JSON.stringify(stagedManifest, null, 2)}\n`)

console.log(`Created package release snapshot in ${outDir}`)
console.log(`Version: ${version}`)

async function assertDistExists() {
  for (const file of ['index.js', 'benchmark.js', 'worker-runtime.js']) {
    try {
      await readFile(resolve(distDir, file), 'utf8')
    } catch {
      throw new Error(`Missing build output library/dist/${file}. Run \`bun run build:library\` before packaging.`)
    }
  }
}

async function assertModelsExist() {
  try {
    await readFile(resolve(modelsDir, 'Xenova/all-MiniLM-L12-v2/onnx/model_quantized.onnx'))
  } catch {
    throw new Error('Missing bundled L12 model files under library/models.')
  }
}

async function copyPath(from: string, to: string) {
  await cp(from, to, { recursive: true })
}

function resolveReleaseVersion(raw: string) {
  const normalized = raw.trim()

  if (!normalized) {
    return '0.1.0'
  }

  return normalized.startsWith('v') ? normalized.slice(1) : normalized
}
