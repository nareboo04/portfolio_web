import { createHash } from 'crypto'
import { promisify } from 'util'

// Use bcryptjs via dynamic import after npm install, or fall back to a helper message
const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <your-password>')
  process.exit(1)
}

try {
  const { default: bcrypt } = await import('bcryptjs')
  const hash = await bcrypt.hash(password, 12)
  console.log('\nBcrypt hash (paste into ADMIN_PASSWORD_HASH in .env):')
  console.log(hash)
} catch {
  console.error('Run `npm install` first, then try again.')
  process.exit(1)
}
