import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { database } from '../../server/mongodb.js'
import { json, readJson } from '../../server/http.js'
import { readSession } from '../../server/session.js'
import { publicUser, users } from '../../server/users.js'

export default async function handler(req,res) {
  const reply = (status, body) => json(res,status,body)
  if (!['GET','POST','DELETE'].includes(req.method)) return reply(405,{error:'Method not allowed.'})
  try {
    const session = await readSession(req)
    if (!session) return reply(401,{error:'Log in to manage your avatar.'})
    const collection = await users()
    const filter = {_id:session.userId}
    const user = await collection.findOne(filter)
    if (!user) return reply(401,{error:'Log in to manage your avatar.'})
    const images = (await database()).collection('taskforge_avatars')
    if (req.method === 'GET') {
      const id = new URL(req.url, 'http://localhost').searchParams.get('v')
      if (!id || user.profileImageUrl !== '/api/user/avatar?v=' + id) return reply(404,{error:'Picture not found.'})
      const image = await images.findOne({_id:id, owner:user._id})
      if (!image) return reply(404,{error:'Picture not found.'})
      res.setHeader('Cache-Control','private, no-cache')
      res.setHeader('Content-Type','image/webp')
      res.setHeader('X-Content-Type-Options','nosniff')
      return res.end(image.bytes.buffer)
    }
    const payload = await readJson(req, 500_000)
    let id
    if (req.method === 'POST') {
      if (typeof payload?.image !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(payload.image)) return reply(400,{error:'Choose a JPG, PNG, or WebP picture.'})
      let bytes
      try {
        const image = sharp(Buffer.from(payload.image,'base64'), {limitInputPixels:4_000_000})
        const meta = await image.metadata()
        if (!['jpeg','png','webp'].includes(meta.format)) return reply(400,{error:'Choose a JPG, PNG, or WebP picture.'})
        bytes = await image.rotate().resize(256,256,{fit:'cover'}).webp({quality:86}).toBuffer()
      } catch {
        return reply(400,{error:'This picture could not be processed.'})
      }
      id = randomUUID()
      await images.insertOne({_id:id,owner:user._id,bytes})
    }
    const previous = await collection.findOneAndUpdate(filter,{$set:{profileImageUrl:id ? '/api/user/avatar?v=' + id : '',updatedAt:new Date()}},{returnDocument:'before'})
    const old = previous?.profileImageUrl?.split('?v=')[1]
    if (old) await images.deleteOne({_id:old,owner:user._id}).catch(error => console.error('Avatar cleanup failed',error.name))
    return reply(200,{user:publicUser(await collection.findOne(filter))})
  } catch (error) {
    if (error instanceof SyntaxError) return reply(400,{error:'Invalid JSON.'})
    if (error.status) return reply(error.status,{error:error.message})
    console.error('TaskForge avatar request failed',error.name)
    return reply(503,{error:'Avatar changes are temporarily unavailable.'})
  }
}