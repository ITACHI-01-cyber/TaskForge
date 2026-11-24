import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derive = promisify(scrypt)
const strong = {N:32768,r:8,p:3,maxmem:64*1024*1024}
export async function createPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const passwordHash = (await derive(password,salt,64,strong)).toString('hex')
  return {salt,passwordHash,passwordVersion:2}
}
export async function verifyPassword(password,user) {
  const expected = Buffer.from(user?.passwordHash ?? '', 'hex')
  const salt = typeof user?.salt === 'string' ? user.salt : 'taskforge-login-placeholder'
  const actual = await derive(password,salt,64,user?.passwordVersion === 2 || !user ? strong : {})
  return !!user && expected.length === actual.length && timingSafeEqual(actual,expected)
}