const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  ELECTRON_MIRROR: process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR:
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR || 'https://npmmirror.com/mirrors/electron-builder-binaries/',
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' })
  return result.status ?? 1
}

require('./patch-electron-extract.cjs')()

let status = run('npx', ['electron-builder', '--win', 'nsis', '--publish', 'never'])
if (status !== 0) {
  const unpacked = path.join(root, 'release', 'win-unpacked')
  const exe = path.join(unpacked, '记账本.exe')
  if (!fs.existsSync(exe)) process.exit(status)
  const staging = path.join(root, '.pack-tmp')
  const staged = path.join(staging, 'win-unpacked')
  fs.mkdirSync(staging, { recursive: true })
  fs.rmSync(staged, { recursive: true, force: true })
  fs.cpSync(unpacked, staged, { recursive: true })
  status = run('npx', [
    'electron-builder',
    '--win',
    'nsis',
    '--prepackaged',
    staged,
    '--publish',
    'never',
    '--config.directories.output',
    staging,
  ])
  if (status === 0) {
    const files = fs.readdirSync(staging).filter((name) => name.endsWith('.exe') && name.includes('Setup'))
    fs.mkdirSync(path.join(root, 'release'), { recursive: true })
    for (const name of files) {
      fs.copyFileSync(path.join(staging, name), path.join(root, 'release', name))
      fs.copyFileSync(path.join(staging, name), path.join(root, name))
    }
  }
}

function copyInstallersToRoot() {
  const releaseDir = path.join(root, 'release')
  if (!fs.existsSync(releaseDir)) return
  for (const name of fs.readdirSync(releaseDir)) {
    if (name.endsWith('.exe') && name.includes('Setup')) {
      fs.copyFileSync(path.join(releaseDir, name), path.join(root, name))
    }
  }
}

copyInstallersToRoot()
process.exit(status)
