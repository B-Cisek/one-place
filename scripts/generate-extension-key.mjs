import { createHash, generateKeyPairSync } from 'node:crypto'

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const der = publicKey.export({ type: 'spki', format: 'der' })
const id = createHash('sha256')
  .update(der)
  .digest('hex')
  .slice(0, 32)
  .split('')
  .map((char) => String.fromCharCode(97 + parseInt(char, 16)))
  .join('')

console.log(`KEY=${der.toString('base64')}`)
console.log(`ID=${id}`)
