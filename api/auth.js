import { randomUUID } from 'node:crypto'
import { createPassword, verifyPassword } from '../server/password.js'
import { throttleAuth } from '../server/rateLimit.js'
import { lookupLogin, publicUser, users } from '../server/users.js'
import { json, readJson } from '../server/http.js'
import { endSession, readSession, startSession } from '../server/session.js'
import { accountKey, gmailPattern, normalizeEmail, validPassword } from '../src/utils/authValidation.js'

export default async function handler(req, res) {
  const reply = (status, value) => json(res, status, value)
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return reply(405, {error:'Method not allowed.'})
  }
  try {
    if (req.method === 'GET') {
      const session = await readSession(req)
      const user = session && await (await users()).findOne({_id:session.userId})
      return reply(200, {user:user ? publicUser(user) : null})
    }
    const body = await readJson(req, 8192)
    if (body?.action === 'logout') {
      await endSession(req, res)
      return reply(200, {user:null})
    }
    if (!['signup', 'login'].includes(body?.action)) return reply(400, {error:'Invalid authentication action.'})
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    if (email.length > 254 || !gmailPattern.test(email)) return reply(400, {error:'Enter a valid Gmail address.'})
    if (!validPassword(body.password)) return reply(400, {error:'Password must be 8 to 128 characters.'})
    const loginKey = accountKey(email)
    const retry = await throttleAuth(req,body.action,loginKey)
    if (retry) {
      res.setHeader('Retry-After',String(retry))
      return reply(429,{error:'Too many attempts. Try again later.'})
    }
    const collection = await users()
    let user
    if (body.action === 'signup') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name || name.length > 100) return reply(400, {error:'Enter a name of 1 to 100 characters.'})
      if (await collection.findOne(lookupLogin(loginKey))) return reply(409, {error:'An account already exists for this Gmail address. Log in instead.'})
      user = {_id:randomUUID(), loginKey, name, email, ...(await createPassword(body.password)), createdAt:new Date()}
      try { await collection.insertOne(user) }
      catch (error) {
        if (error.code === 11000) return reply(409, {error:'An account already exists for this Gmail address. Log in instead.'})
        throw error
      }
    } else {
      user = await collection.findOne(lookupLogin(loginKey))
      if (!(await verifyPassword(body.password,user))) {
        return reply(401, {error:'Email or password is incorrect.'})
      }
      if (user.passwordVersion !== 2) {
        await collection.updateOne({_id:user._id,passwordHash:user.passwordHash},{$set:await createPassword(body.password)})
      }
    }
    await startSession(req, res, user._id)
    return reply(body.action === 'signup' ? 201 : 200, {user:publicUser(user)})
  } catch (error) {
    if (error instanceof SyntaxError) return reply(400, {error:'Invalid JSON.'})
    if (error.status) return reply(error.status, {error:error.message})
    console.error('TaskForge authentication failed', error.name, error.code ?? '')
    return reply(503, {error:'Authentication is temporarily unavailable. Try again.'})
  }
}