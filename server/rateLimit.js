import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { database } from './mongodb.js'

const windowMs = 15 * 60 * 1000
let expiryIndex
const digest = value => createHash('sha256').update(value).digest('hex')

function address(req) {
  const forwarded = process.env.VERCEL && String(req.headers['x-vercel-forwarded-for'] ?? '').split(',')[0].trim()
  return forwarded && isIP(forwarded) ? forwarded : req.socket?.remoteAddress ?? 'unknown'
}

export async function throttleAuth(req, action, account, now = Date.now()) {
  const collection = (await database()).collection('taskforge_auth_limits')
  expiryIndex ??= collection.createIndex({expiresAt:1}, {expireAfterSeconds:0}).catch(error => {
    expiryIndex = undefined
    throw error
  })
  await expiryIndex
  const expiresAt = new Date((Math.floor(now / windowMs) + 1) * windowMs)
  async function exceeds(scope, key, limit) {
    const id = scope + ':' + digest(key) + ':' + expiresAt.getTime()
    const update = {$setOnInsert:{expiresAt}, $inc:{count:1}}
    let entry
    try {
      entry = await collection.findOneAndUpdate({_id:id},update,{upsert:true,returnDocument:'after'})
    } catch (error) {
      if (error.code !== 11000) throw error
      entry = await collection.findOneAndUpdate({_id:id},update,{returnDocument:'after'})
    }
    return entry.count > limit
  }
  const blocked = await exceeds(action + '-ip',address(req),action === 'signup' ? 18 : 60)
    || (action === 'login' && await exceeds('login-account',account,12))
  return blocked ? Math.max(1,Math.ceil((expiresAt.getTime() - now) / 1000)) : 0
}