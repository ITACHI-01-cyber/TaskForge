import { json, readJson } from '../../server/http.js'
import { readSession } from '../../server/session.js'
import { throttleAuth } from '../../server/rateLimit.js'
import { verifyPassword } from '../../server/password.js'
import { lookupLogin, publicUser, users } from '../../server/users.js'
import { accountKey, gmailPattern, normalizeEmail, validPassword } from '../../src/utils/authValidation.js'

export default async function handler(req,res) {
  const reply = (status, body) => json(res,status,body)
  if (!['GET','PATCH'].includes(req.method)) return reply(405,{error:'Method not allowed.'})
  try {
    const session = await readSession(req)
    if (!session) return reply(401,{error:'Log in to open your profile.'})
    const collection = await users()
    const user = await collection.findOne({_id:session.userId})
    if (!user) return reply(401,{error:'Log in to open your profile.'})
    if (req.method === 'GET') return reply(200,{user:publicUser(user)})
    const body = await readJson(req,8192)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
    if (!name || name.length > 100) return reply(400,{error:'Enter a name of 1 to 100 characters.'})
    if (email.length > 254 || !gmailPattern.test(email)) return reply(400,{error:'Enter a valid Gmail address.'})
    if (email !== user.email) {
      const retry = await throttleAuth(req,'login',accountKey(user.email))
      if (retry) {
        res.setHeader('Retry-After',String(retry))
        return reply(429,{error:'Too many attempts. Try again later.'})
      }
      if (!validPassword(body.currentPassword) || !(await verifyPassword(body.currentPassword,user))) {
        return reply(400,{error:'Enter the current password to change your Gmail address.'})
      }
    }
    const loginKey = accountKey(email)
    const owner = await collection.findOne(lookupLogin(loginKey),{projection:{_id:1}})
    if (owner && owner._id !== user._id) return reply(409,{error:'This Gmail address is already in use.'})
    const updated = await collection.findOneAndUpdate({_id:user._id},{$set:{name,email,loginKey,updatedAt:new Date()}},{returnDocument:'after'})
    return reply(200,{user:publicUser(updated)})
  } catch (error) {
    if (error.code === 11000) return reply(409,{error:'This Gmail address is already in use.'})
    if (error instanceof SyntaxError) return reply(400,{error:'Invalid JSON.'})
    if (error.status) return reply(error.status,{error:error.message})
    console.error('TaskForge profile request failed', error.name)
    return reply(503,{error:'Profile changes are temporarily unavailable.'})
  }
}