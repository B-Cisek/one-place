// Start-up JS of the new tab: the entry script and every chunk it preloads (<link rel="modulepreload">).
// Chunks loaded later with import() do not count. Run after `pnpm --filter @one-place/extension build`.
import { readFileSync, statSync } from 'node:fs'

const BUDGET_KB = 550
const output = new URL('../apps/extension/.output/chrome-mv3/', import.meta.url)

const html = readFileSync(new URL('newtab.html', output), 'utf8')
const files = [...html.matchAll(/(?:src|href)="\/(chunks\/[^"]+\.js)"/g)].map((match) => match[1])

let totalKb = 0
for (const file of files) {
  const kb = statSync(new URL(file, output)).size / 1000
  totalKb += kb
  console.log(`${kb.toFixed(1).padStart(7)} kB  ${file}`)
}
console.log(`${totalKb.toFixed(1).padStart(7)} kB  total (budget ${BUDGET_KB} kB)`)

if (totalKb > BUDGET_KB) {
  console.error(`Start-up JS is ${(totalKb - BUDGET_KB).toFixed(1)} kB over the budget`)
  process.exitCode = 1
}
