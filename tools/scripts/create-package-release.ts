import { mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const releaseDir = fileURLToPath(new URL('../package-release/', import.meta.url))

await rm(releaseDir, { recursive: true, force: true })
await mkdir(releaseDir, { recursive: true })

console.log(`Package release directory prepared at ${releaseDir}`)
