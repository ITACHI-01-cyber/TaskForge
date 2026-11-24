import { createHash, randomBytes } from 'node:crypto'
import { database } from './mongodb.js'

const cookieName = 'taskforge_account'
const duration = 7 * 24 * 60 * 60
const key = token => createHash('sha256').update(token).digest('hex')
let index

async function sessions() {
  const collection = (await database()).collection('taskforge_sessions')
  index ??= collection.createIndex({expiresAt:1}, {expireAfterSeconds:0}).catch(error => {
    index = undefined
    throw error
  })
  await index
  return collection
}
function tokenFrom(req) {
  const value = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1)
  return /^[0-9a-f]{64}$/.test(value ?? '') ? value : null
}
function setCookie(req, res, value, age) {
  const secure = process.env.VERCEL || req.socket?.encrypted ? '; Secure' : ''
  res.setHeader('Set-Cookie', cookieName + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + age + secure)
}
export async function readSession(req) {
  const token = tokenFrom(req)
  return token ? (await sessions()).findOne({_id:key(token), expiresAt:{$gt:new Date()}}) : null
}
export async function endSession(req, res) {
  const token = tokenFrom(req)
  if (token) await (await sessions()).deleteOne({_id:key(token)})
  setCookie(req, res, '', 0)
}
export async function startSession(req, res, userId) {
  await endSession(req, res)
  const token = randomBytes(32).toString('hex')
  await (await sessions()).insertOne({_id:key(token), userId, expiresAt:new Date(Date.now() + duration * 1000)})
  setCookie(req, res, token, duration)
}