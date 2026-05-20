/**
 * Windows 打包（使用国内镜像下载 NSIS 等）
 * 用法: npm run dist:win
 */
const { spawnSync } = require('child_process')
const path = require('path')

const env = {
  ...process.env,
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
  npm_config_registry: 'https://registry.npmmirror.com',
  CSC_IDENTITY_AUTO_DISCOVERY: 'false'
}

const electronBuilder = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
)

const result = spawnSync(
  electronBuilder,
  ['--win', '--config', 'electron-builder.yml'],
  { env, stdio: 'inherit', shell: true, cwd: path.join(__dirname, '..') }
)

process.exit(result.status ?? 1)
