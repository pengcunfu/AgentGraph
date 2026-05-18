/**
 * 使用国内镜像安装依赖（npmmirror）
 * 用法: npm run install:cn
 */
const { spawnSync } = require('child_process')

const env = {
  ...process.env,
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
  npm_config_registry: 'https://registry.npmmirror.com'
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npm, ['install', ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
  shell: true
})

process.exit(result.status ?? 1)
