/** Zips dist/ into the installable extension package. Run after `npm run build`. */
import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'

const out = 'klarsicht-extension.zip'
if (!existsSync('dist/manifest.json')) {
  console.error('dist/manifest.json missing. Run `npm run build` first.')
  process.exit(1)
}
rmSync(out, { force: true })
if (process.platform === 'win32') {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path dist/* -DestinationPath ${out}"`,
    {
      stdio: 'inherit',
    },
  )
} else {
  execSync(`cd dist && zip -qr ../${out} .`, { stdio: 'inherit' })
}
console.log(`packed ${out}`)
