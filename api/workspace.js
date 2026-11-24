import { workspaces } from '../server/mongodb.js'
import { json, readJson } from '../server/http.js'
import { readSession } from '../server/session.js'
import { validate } from '../src/services/storageService.js'

const state = doc => ({data:doc?.data ?? null, revision:doc?.revision ?? 0})

export default async function handler(req, res) {
  const reply = (status, value) => json(res, status, value)
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT')
    return reply(405, {error:'Method not allowed.'})
  }
  try {
    const session = await readSession(req)
    if (!session) return reply(401, {error:'Log in to open your TaskForge workspace.'})
    if (req.headers['x-taskforge-account'] !== session.userId) {
      return reply(401, {error:'The signed-in account changed. Refresh to continue.'})
    }
    const workspaceId = 'user:' + session.userId
    let data, revision
    if (req.method === 'PUT') {
      const body = await readJson(req, 4_000_000)
      revision = body?.revision
      if (!Number.isSafeInteger(revision) || revision < 0) return reply(400, {error:'Invalid workspace revision.'})
      try { data = validate(body.data) }
      catch { return reply(400, {error:'Invalid TaskForge workspace.'}) }
    }
    const collection = await workspaces()
    if (req.method === 'GET') return reply(200, state(await collection.findOne({_id:workspaceId})))
    if (revision === 0) {
      try {
        await collection.insertOne({_id:workspaceId, data, revision:1})
        return reply(200, {data, revision:1})
      } catch (error) {
        if (error.code !== 11000) throw error
      }
    } else {
      const result = await collection.updateOne({_id:workspaceId, revision}, {$set:{data}, $inc:{revision:1}})
      if (result.matchedCount) return reply(200, {data, revision:revision + 1})
    }
    return reply(409, {error:'The workspace changed on another tab or device.', ...state(await collection.findOne({_id:workspaceId}))})
  } catch (error) {
    if (error instanceof SyntaxError) return reply(400, {error:'Invalid JSON.'})
    if (error.status) return reply(error.status, {error:error.message})
    console.error('TaskForge MongoDB request failed', error.name, error.code ?? '')
    return reply(503, {error:'MongoDB is currently unavailable.'})
  }
}