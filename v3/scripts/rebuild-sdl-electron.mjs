/**
 * Rebuilds @kmamal/sdl against Electron's Node.js ABI.
 *
 * Run this once after npm install on a new machine:
 *   npm run rebuild:sdl
 *
 * Why: @kmamal/sdl ships prebuilt binaries for regular Node.js.
 * Electron has its own embedded Node.js with a different ABI, so
 * the prebuilt binary causes a SIGSEGV on startup. This script:
 *   1. Downloads SDL2 headers (needed to compile from source)
 *   2. Compiles @kmamal/sdl against Electron's Node.js headers
 *   3. Copies the result to dist/sdl.node (where the package loads from)
 */

import { execSync } from 'node:child_process'
import { existsSync, copyFileSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')
const sdlPackage = join(root, 'node_modules/@kmamal/sdl')
const sdlDir = join(sdlPackage, 'sdl')
const sdlInc = join(sdlDir, 'include')
const sdlLib = join(sdlDir, 'lib')
const builtNode = join(sdlPackage, 'build/Release/sdl.node')
const distNode = join(sdlPackage, 'dist/sdl.node')

// Step 1: Download SDL2 headers if not already present
if (!existsSync(sdlInc)) {
    console.log('[rebuild-sdl] Downloading SDL2 headers...')
    execSync('node scripts/download-sdl.mjs', {
        cwd: sdlPackage,
        stdio: 'inherit',
    })
} else {
    console.log('[rebuild-sdl] SDL2 headers already present, skipping download.')
}

// The SDL2 lib directory has libSDL2-2.0.0.dylib and libSDL2-2.0.dylib, but
// -lSDL2 requires libSDL2.dylib — create the symlink if missing.
const sdlDylibSymlink = join(sdlLib, 'libSDL2.dylib')
if (!existsSync(sdlDylibSymlink)) {
    console.log('[rebuild-sdl] Creating libSDL2.dylib symlink...')
    symlinkSync('libSDL2-2.0.0.dylib', sdlDylibSymlink)
}

// Step 2: Rebuild @kmamal/sdl for Electron
console.log('[rebuild-sdl] Rebuilding @kmamal/sdl for Electron...')
execSync('npx @electron/rebuild -f -w @kmamal/sdl', {
    cwd: root,
    stdio: 'inherit',
    env: {
        ...process.env,
        SDL_INC: sdlInc,
        SDL_LIB: sdlLib,
    },
})

// Step 3: Copy rebuilt binary to dist/ (where the package loads from)
console.log('[rebuild-sdl] Copying to dist/sdl.node...')
copyFileSync(builtNode, distNode)
console.log('[rebuild-sdl] Done. @kmamal/sdl is now compatible with Electron.')
