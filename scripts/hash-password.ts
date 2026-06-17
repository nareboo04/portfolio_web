import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Usage: npm run hash-password <your-password>')
  process.exit(1)
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nBcrypt hash (paste into ADMIN_PASSWORD_HASH):')
  console.log(hash)
})
