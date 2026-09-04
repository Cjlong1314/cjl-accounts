const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const androidDir = path.join(root, 'android')
const sdkDir = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')
const releaseDir = path.join(root, 'release')

if (!fs.existsSync(androidDir)) {
  console.error('未找到 android 工程，请先执行: npx cap add android')
  process.exit(1)
}

if (!fs.existsSync(sdkDir)) {
  console.error(`未找到 Android SDK: ${sdkDir}`)
  process.exit(1)
}

fs.writeFileSync(
  path.join(androidDir, 'local.properties'),
  `sdk.dir=${sdkDir.replace(/\\/g, '\\\\')}\n`,
)

fs.mkdirSync(releaseDir, { recursive: true })

const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const env = {
  ...process.env,
  ANDROID_HOME: sdkDir,
  ANDROID_SDK_ROOT: sdkDir,
}

const result = spawnSync(gradle, ['assembleDebug'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const apk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
const fileName = '记账本-1.0.0-android-debug.apk'
const dest = path.join(releaseDir, fileName)
const destRoot = path.join(root, fileName)
if (!fs.existsSync(apk)) {
  console.error(`未找到 APK: ${apk}`)
  process.exit(1)
}
fs.copyFileSync(apk, dest)
fs.copyFileSync(apk, destRoot)
console.log(`Android 安装包已输出: ${destRoot}`)
