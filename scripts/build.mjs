#!/usr/bin/env node
/**
 * BestVPN cross-platform build helper.
 *
 * Runs on macOS, Windows and Linux (Node.js + pnpm are required, same as the
 * rest of the repo tooling). It resolves the Rust target triple for the
 * requested platform/arch, downloads the matching mihomo core, and invokes
 * `tauri build`.
 *
 * IMPORTANT: Tauri produces native installer bundles, so a bundle can only be
 * built ON the OS it targets (no cross-OS bundling). Use this script on each OS,
 * or use the CI matrix in `.github/workflows/release.yml`.
 *
 * Usage:
 *   node scripts/build.mjs                         # build for the current OS/arch (release)
 *   node scripts/build.mjs --platform windows      # build for Windows (run on Windows)
 *   node scripts/build.mjs --platform linux --arch arm64
 *   node scripts/build.mjs --target aarch64-apple-darwin
 *   node scripts/build.mjs --profile fast          # fast-release cargo profile (dev iteration)
 *   node scripts/build.mjs --force                 # force re-download of the mihomo core
 *   node scripts/build.mjs --skip-prebuild         # skip the mihomo core download step
 *   node scripts/build.mjs --help
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { log_error, log_info, log_success } from './utils.mjs'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const RUSTUP_BIN = join(
  process.env.HOME ?? process.env.USERPROFILE ?? '',
  '.cargo',
  'bin',
)
const TOOL_ENV = {
  PATH: `${RUSTUP_BIN}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH ?? ''}`,
}

// ---------------------------------------------------------------------------
// Platform / target resolution
// ---------------------------------------------------------------------------

/** Rust target triple per platform + architecture. */
const TARGETS = {
  macos: {
    x64: 'x86_64-apple-darwin',
    arm64: 'aarch64-apple-darwin',
  },
  windows: {
    x64: 'x86_64-pc-windows-msvc',
    arm64: 'aarch64-pc-windows-msvc',
  },
  linux: {
    x64: 'x86_64-unknown-linux-gnu',
    arm64: 'aarch64-unknown-linux-gnu',
    armv7: 'armv7-unknown-linux-gnueabihf',
  },
}

/** Map a Rust target triple back to its OS. */
const TARGET_OS = {
  'x86_64-apple-darwin': 'macos',
  'aarch64-apple-darwin': 'macos',
  'x86_64-pc-windows-msvc': 'windows',
  'aarch64-pc-windows-msvc': 'windows',
  'x86_64-unknown-linux-gnu': 'linux',
  'aarch64-unknown-linux-gnu': 'linux',
  'armv7-unknown-linux-gnueabihf': 'linux',
}

/** node `process.platform` -> our platform name. */
const HOST_PLATFORM = { darwin: 'macos', win32: 'windows', linux: 'linux' }[
  process.platform
]

/** node `process.arch` -> our arch name. */
const HOST_ARCH = { x64: 'x64', arm64: 'arm64' }[process.arch]

/** Detect the Rust host triple (e.g. `x86_64-apple-darwin`) from `rustc -vV`. */
function getHostTriple() {
  const result = spawnSync('rustc', ['-vV'], {
    cwd: ROOT,
    env: { ...process.env, ...TOOL_ENV },
    encoding: 'utf8',
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  const match = output.match(/host:\s*(\S+)/)
  return match ? match[1] : null
}

/** Directory that will hold bundles for a given target + cargo profile. */
const BUNDLE_DIR = (target, profile, isNative) =>
  isNative
    ? join(ROOT, 'target', profile, 'bundle')
    : join(ROOT, 'target', target, profile, 'bundle')

function fail(message) {
  log_error(message)
  process.exit(1)
}

function parseArgs(argv) {
  const options = {
    platform: undefined,
    arch: undefined,
    target: undefined,
    profile: 'release',
    force: false,
    skipPrebuild: false,
    help: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true
        break
      case '-f':
      case '--force':
        options.force = true
        break
      case '--skip-prebuild':
        options.skipPrebuild = true
        break
      case '--platform':
        options.platform = argv[++i]
        break
      case '--arch':
        options.arch = argv[++i]
        break
      case '--target':
        options.target = argv[++i]
        break
      case '--profile':
        options.profile = argv[++i]
        break
      default:
        fail(`Unknown argument: ${arg} (run with --help for usage)`)
    }
  }

  return options
}

function resolveTarget(options) {
  if (options.target) {
    if (!TARGET_OS[options.target]) {
      fail(`Unknown Rust target: ${options.target}`)
    }
    return options.target
  }

  const platform = options.platform ?? HOST_PLATFORM
  const arch = options.arch ?? (platform === HOST_PLATFORM ? HOST_ARCH : 'x64')

  const targets = TARGETS[platform]
  if (!targets) {
    fail(`Unknown platform: ${platform} (expected macos, windows or linux)`)
  }
  const target = targets[arch]
  if (!target) {
    fail(`Unsupported arch "${arch}" for platform "${platform}"`)
  }
  return target
}

function run(command, args, env = {}) {
  log_info(`> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    fail(`${command} exited with status ${result.status}`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const options = parseArgs(process.argv.slice(2))

if (options.help) {
  console.log(`Usage:
  node scripts/build.mjs [options]

Options:
  --platform <macos|windows|linux>   Target OS (default: current OS)
  --arch <x64|arm64|armv7>           Target CPU architecture (default: host arch)
  --target <rust-triple>             Explicit Rust target, e.g. aarch64-apple-darwin
  --profile <release|fast>           Cargo profile. "fast" = fast-release (dev iteration)
  --force, -f                        Force re-download of the mihomo core
  --skip-prebuild                    Skip the mihomo core download step
  --help, -h                         Show this help
`)
  process.exit(0)
}

if (!HOST_PLATFORM) {
  fail(`Unsupported host OS: ${process.platform}`)
}

const target = resolveTarget(options)
const targetOS = TARGET_OS[target]

if (targetOS !== HOST_PLATFORM) {
  fail(
    `Cannot build a "${targetOS}" bundle from "${HOST_PLATFORM}".\n` +
      `Tauri bundles are OS-native: run this script on ${targetOS}, or build all three ` +
      `platforms via CI (.github/workflows/release.yml).`,
  )
}

const hostTriple = getHostTriple()
const isNative = hostTriple === null || hostTriple === target

if (!isNative) {
  log_info(
    `Cross-arch build: host = ${hostTriple}, target = ${target}. ` +
      `This requires the target's Rust std library to be installed.`,
  )
  // Best-effort: install the target via rustup when it is the active toolchain.
  // (If `rustc` on PATH is e.g. a Homebrew install, this won't help and the
  // build will fail with cargo's own clear error.)
  const rustup = spawnSync('rustup', ['target', 'add', target], {
    cwd: ROOT,
    env: { ...process.env, ...TOOL_ENV },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (rustup.status !== 0) {
    log_error(`Could not install Rust target ${target}. Install it manually (` +
      `rustup target add ${target}) or build for the host arch instead.`)
  }
}

if (!existsSync(join(ROOT, 'node_modules'))) {
  log_info('node_modules not found; installing dependencies…')
  run('pnpm', ['install'])
}

// 1. Download the matching mihomo core + service binaries for the target.
if (!options.skipPrebuild) {
  const prebuildArgs = ['run', 'prebuild']
  if (!isNative) {
    prebuildArgs.push(target)
  }
  if (options.force) {
    prebuildArgs.push('--force')
  }
  run('pnpm', prebuildArgs)
}

// 2. Build the Tauri app (frontend is compiled by the beforeBuildCommand hook).
const buildArgs = ['exec', 'tauri', 'build']
if (!isNative) {
  buildArgs.push('--target', target)
}
if (options.profile === 'fast') {
  buildArgs.push('--', '--profile', 'fast-release')
} else if (options.profile !== 'release') {
  fail(`Unknown profile: ${options.profile} (expected "release" or "fast")`)
}
run('pnpm', buildArgs, {
  ...TOOL_ENV,
  NODE_OPTIONS: '--max-old-space-size=4096',
})

// 3. Report the outputs.
log_success('Build finished.')
log_info(`Bundles are under: ${BUNDLE_DIR(target, options.profile, isNative)}`)
if (targetOS === 'macos') {
  log_info('  macOS:  bundle/macos/*.app  and  bundle/dmg/*.dmg')
} else if (targetOS === 'windows') {
  log_info('  Windows: bundle/nsis/*-setup.exe  (and bundle/msi/*.msi if enabled)')
} else {
  log_info('  Linux:  bundle/deb/*.deb, bundle/rpm/*.rpm and bundle/appimage/*.AppImage')
}
